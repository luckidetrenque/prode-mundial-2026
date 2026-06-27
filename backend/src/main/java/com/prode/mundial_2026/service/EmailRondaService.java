package com.prode.mundial_2026.service;

import com.prode.mundial_2026.model.RondaEmailLog;
import com.prode.mundial_2026.repository.EmailRondaRepository;
import com.prode.mundial_2026.repository.PosicionRepository;
import com.prode.mundial_2026.repository.RondaEmailLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio de emails masivos al cierre de cada ronda de la fase de grupos.
 *
 * Responsabilidades:
 * 1. Validar que la ronda esté 100% completa (24 resultados cargados).
 * 2. Validar que no se haya enviado ya (consulta RondaEmailLog).
 * 3. Calcular aciertos de ronda y puntos acumulados por planilla.
 * 4. Enviar un email personalizado a cada participante confirmado.
 * 5. [RONDA 3 ÚNICAMENTE] Incluir el diploma de campeón/subcampeón/tercer
 * puesto
 * en el mismo email para los participantes del top 3 (con empates incluidos).
 * 6. Registrar el envío en RondaEmailLog para evitar reenvíos.
 *
 * No interfiere con EmailService (confirmación individual) ni con
 * EmailCierreService (cierre de inscripción).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailRondaService {

  private final JavaMailSender mailSender;
  private final EmailRondaRepository emailRondaRepository;
  private final RondaEmailLogRepository rondaEmailLogRepository;
  private final PosicionRepository posicionRepository; // ← nuevo: para el ranking final

  private static final String BASE_URL = "https://prode-mundial-2026-62343.web.app";
  private static final int PARTIDOS_POR_JORNADA = 24;

  @Value("${app.email.from}")
  private String emailFrom;

  @Value("${app.email.from-name}")
  private String emailFromName;

  // ── Punto de entrada público ──────────────────────────────────────────────

  /**
   * Punto de entrada llamado por RondasScheduler.
   *
   * Valida condiciones y, si todo está OK, delega en el método @Async
   * para no bloquear el hilo del scheduler.
   *
   * @param rondaNumero 1, 2 o 3
   * @param jornada     número de jornada JPA (1, 2 o 3) — mismo valor
   * @param nombreRonda texto para logs y asunto del email ("Primera", etc.)
   */
  public void procesarRonda(int rondaNumero, int jornada, String nombreRonda) {

    // Guardia 1: ¿ya se enviaron los emails de esta ronda?
    if (rondaEmailLogRepository.existsByRondaNumero(rondaNumero)) {
      log.info("[RONDA {}] Emails ya enviados anteriormente. Se omite.", rondaNumero);
      return;
    }

    // Guardia 2: ¿están cargados los 24 resultados de la jornada?
    int resultadosCargados = emailRondaRepository.countResultadosPorJornada(jornada);
    if (resultadosCargados < PARTIDOS_POR_JORNADA) {
      log.warn("[RONDA {}] Solo {} de {} resultados cargados. Se omite el envío.",
          rondaNumero, resultadosCargados, PARTIDOS_POR_JORNADA);
      return;
    }

    log.info("[RONDA {}] Validaciones OK ({} resultados). Iniciando envío async...",
        rondaNumero, resultadosCargados);

    enviarEmailsRondaAsync(rondaNumero, jornada, nombreRonda);
  }

  // ── Envío asíncrono ───────────────────────────────────────────────────────

  @Async
  @Transactional(readOnly = true)
  public void enviarEmailsRondaAsync(int rondaNumero, int jornada, String nombreRonda) {

    if (rondaEmailLogRepository.existsByRondaNumero(rondaNumero)) {
      log.info("[RONDA {}] Emails ya enviados (verificación async). Se omite.", rondaNumero);
      return;
    }

    List<Object[]> stats = emailRondaRepository.calcularStatsRonda(jornada);

    if (stats.isEmpty()) {
      log.warn("[RONDA {}] No hay planillas confirmadas. No se enviaron emails.", rondaNumero);
      return;
    }

    // Para ronda 3: calcular el mapa de puesto por codigoPlanilla ANTES de iterar
    // Map<codigoPlanilla, puesto> — 0 si no está en el podio
    Map<Long, Integer> puestosPodio = (rondaNumero == 3)
        ? calcularPuestosPodio()
        : Map.of();

    if (rondaNumero == 3) {
      log.info("[RONDA 3] Podio calculado: {} planillas con diploma.", puestosPodio.size());
    }

    log.info("[RONDA {}] {} participantes a notificar.", rondaNumero, stats.size());

    int enviados = 0;
    int errores = 0;

    for (Object[] row : stats) {
      String nombre = (String) row[0];
      String apellido = (String) row[1];
      String email = (String) row[2];
      Long codigoPlanilla = (Long) row[3];
      long aciertosRonda = toLong(row[4]);
      long puntosTotal = toLong(row[5]);

      String nombreCompleto = nombre + " " + apellido;

      // Puesto en el podio: 1, 2 o 3 — null si no está en el podio
      Integer puesto = puestosPodio.get(codigoPlanilla);

      try {
        enviarEmailRonda(
            email, nombreCompleto, codigoPlanilla,
            rondaNumero, nombreRonda,
            (int) aciertosRonda, (int) puntosTotal,
            puesto);
        enviados++;
        log.info("[RONDA {}] OK → {} (planilla {}){}",
            rondaNumero, email, codigoPlanilla,
            puesto != null ? " 🏅 DIPLOMA " + puesto + "°" : "");
      } catch (Exception e) {
        errores++;
        log.error("[RONDA {}] ERROR → {} (planilla {}): {}",
            rondaNumero, email, codigoPlanilla, e.getMessage());
      }
    }

    guardarLog(rondaNumero, enviados, errores);
    log.info("[RONDA {}] Finalizado. Enviados: {} | Errores: {}", rondaNumero, enviados, errores);
  }

  @Transactional
  public void guardarLog(int rondaNumero, int enviados, int errores) {
    if (!rondaEmailLogRepository.existsByRondaNumero(rondaNumero)) {
      rondaEmailLogRepository.save(
          new RondaEmailLog(rondaNumero, LocalDateTime.now(), enviados, errores));
    }
  }

  // ── Cálculo del podio (solo Ronda 3) ─────────────────────────────────────

  /**
   * Calcula el puesto (1°, 2° o 3°) de cada planilla que merece diploma,
   * respetando empates por puntaje:
   *
   * - El puesto se determina por los puntos, no por la posición en la lista.
   * - Todos los que comparten el mismo puntaje tienen el mismo puesto.
   * - El puesto siguiente se determina por el puntaje siguiente, no por cuántos
   * había antes. Ejemplo: dos con 51 pts → ambos 1°; el de 50 pts → 2°;
   * el de 49 pts → 3°.
   *
   * Retorna Map<codigoPlanilla, puesto> solo para las planillas del podio (1°, 2°
   * y 3°).
   */
  private Map<Long, Integer> calcularPuestosPodio() {
    List<Object[]> ranking = posicionRepository.calcularPuntajesPorPlanilla();

    Map<Long, Integer> podio = new HashMap<>();
    int puestosDistintos = 0; // cuántos puntajes distintos procesamos (máx 3)
    long puntosAnterior = Long.MIN_VALUE;
    int puestoActual = 0;

    for (Object[] row : ranking) {
      long puntos = toLong(row[4]);
      Long codigo = (Long) row[3];

      // Cada vez que cambia el puntaje, es un puesto nuevo
      if (puntos != puntosAnterior) {
        puestosDistintos++;
        puestoActual = puestosDistintos;
        puntosAnterior = puntos;
      }

      // Solo nos interesan los tres puntajes más altos
      if (puestosDistintos > 3)
        break;

      podio.put(codigo, puestoActual);
    }

    return podio;
  }

  // ── Envío individual ──────────────────────────────────────────────────────

  /**
   * @param puesto 1, 2 o 3 si el participante merece diploma; null en caso
   *               contrario
   */
  private void enviarEmailRonda(
      String destino,
      String nombreCompleto,
      Long codigoPlanilla,
      int rondaNumero,
      String nombreRonda,
      int aciertosRonda,
      int puntosTotal,
      Integer puesto)
      throws MessagingException, UnsupportedEncodingException {

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom(emailFrom, emailFromName);
    helper.setTo(destino);

    // Asunto diferenciado para ronda 3 con diploma
    String asunto;
    if (rondaNumero == 3 && puesto != null) {
      asunto = switch (puesto) {
        case 1 -> "🏆 ¡Campeón del Prode Mundial 2026! Tu diploma y resultados finales";
        case 2 -> "🥈 ¡Subcampeón del Prode Mundial 2026! Tu diploma y resultados finales";
        case 3 -> "🥉 ¡Tercer puesto en el Prode Mundial 2026! Tu diploma y resultados finales";
        default -> "⚽ Prode Mundial 2026 — Resultados Finales";
      };
    } else if (rondaNumero == 3) {
      asunto = "⚽ Prode Mundial 2026 — ¡La fase de grupos terminó! Resultados finales";
    } else {
      asunto = "⚽ Prode Mundial 2026 — Resultados " + nombreRonda + " Ronda";
    }

    helper.setSubject(asunto);
    helper.setText(buildEmailHtml(
        nombreCompleto, codigoPlanilla,
        rondaNumero, nombreRonda,
        aciertosRonda, puntosTotal,
        puesto), true);

    mailSender.send(message);
  }

  // ── HTML del email ────────────────────────────────────────────────────────

  private String buildEmailHtml(
      String nombreCompleto,
      Long codigoPlanilla,
      int rondaNumero,
      String nombreRonda,
      int aciertosRonda,
      int puntosTotal,
      Integer puesto) {

    String subtitulo = switch (rondaNumero) {
      case 1 -> "Primera Ronda finalizada";
      case 2 -> "Segunda Ronda finalizada";
      case 3 -> "Fase de Grupos finalizada";
      default -> nombreRonda + " Ronda finalizada";
    };

    String mensajeIntro = switch (rondaNumero) {
      case 1 -> "La primera ronda de la fase de grupos ya terminó. " +
          "Acá te contamos cómo te fue en los primeros 24 partidos.";
      case 2 -> "La segunda ronda de la fase de grupos ya terminó. " +
          "Sumaste más puntos a tu marcador. ¡Seguís en carrera!";
      case 3 -> "¡La fase de grupos terminó! Ya se jugaron los 72 partidos. " +
          "Este es tu resultado final de la fase de grupos.";
      default -> "La " + nombreRonda + " ronda ya terminó.";
    };

    String mensajeFinal = switch (rondaNumero) {
      case 1 -> "¡Todavía quedan dos rondas por jugar! Seguí los resultados en el sitio.";
      case 2 -> "¡Última ronda en camino! Todo puede cambiar. Seguí de cerca la tabla.";
      case 3 -> "¡Gracias por participar en el Prode Mundial 2026! " +
          "Fue un torneo increíble. ¡Hasta la próxima!";
      default -> "Seguí los resultados en el sitio.";
    };

    // Porcentaje de aciertos sobre 24 partidos
    int pct = (int) Math.round((aciertosRonda * 100.0) / PARTIDOS_POR_JORNADA);

    // Color del badge de aciertos según rendimiento
    String badgeColor;
    String badgeBg;
    if (pct >= 60) {
      badgeColor = "#1a7a4a";
      badgeBg = "#e8f8ef";
    } else if (pct >= 40) {
      badgeColor = "#856404";
      badgeBg = "#fff8e1";
    } else {
      badgeColor = "#c0171d";
      badgeBg = "#ffebee";
    }

    // Sección del diploma (solo ronda 3 y si tiene puesto en el podio)
    String seccionDiploma = (rondaNumero == 3 && puesto != null)
        ? buildDiplomaSection(nombreCompleto, codigoPlanilla, puesto, puntosTotal)
        : "";

    return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background:#f2f4f5;font-family:Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0"
              style="background:#f2f4f5;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:16px;overflow:hidden;
                       box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:#2A398D;padding:28px 32px 0;text-align:center;">
                    <div style="font-size:40px;margin-bottom:8px;">⚽</div>
                    <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;
                        letter-spacing:0.5px;">PRODE MUNDIAL 2026</h1>
                    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.6);
                        letter-spacing:1px;text-transform:uppercase;">
                      Canadá · Estados Unidos · México
                    </p>
                    <div style="background:rgba(255,255,255,0.15);border-radius:20px;
                        display:inline-block;padding:4px 16px;margin:12px 0 0;">
                      <span style="font-size:12px;font-weight:700;color:#ffffff;
                          letter-spacing:0.5px;">%s</span>
                    </div>
                    <div style="height:3px;background:#d4a017;margin:16px -32px 0;"></div>
                  </td>
                </tr>

                <!-- Cuerpo -->
                <tr>
                  <td style="padding:28px 32px;">

                    <!-- Saludo -->
                    <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#2A398D;">
                      ¡Hola, %s!
                    </p>
                    <p style="margin:0 0 22px;font-size:13px;color:#474A4A;line-height:1.75;">
                      %s
                    </p>

                    <!-- Stats cards -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                        style="margin-bottom:26px;">
                      <tr>

                        <!-- Card: Aciertos en la ronda -->
                        <td style="width:33%%;padding:0 5px;">
                          <table width="100%%" cellpadding="0" cellspacing="0"
                              style="background:%s;border:1px solid %s;
                              border-radius:10px;text-align:center;">
                            <tr>
                              <td style="padding:16px 10px;">
                                <span style="display:block;font-size:32px;font-weight:800;
                                    color:%s;line-height:1;margin-bottom:4px;">
                                  %d / 24
                                </span>
                                <span style="font-size:10px;text-transform:uppercase;
                                    letter-spacing:0.5px;color:%s;font-weight:600;">
                                  Aciertos esta ronda
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- Card: Porcentaje -->
                        <td style="width:33%%;padding:0 5px;">
                          <table width="100%%" cellpadding="0" cellspacing="0"
                              style="background:#f8f9fa;border:1px solid #e0e0e0;
                              border-radius:10px;text-align:center;">
                            <tr>
                              <td style="padding:16px 10px;">
                                <span style="display:block;font-size:32px;font-weight:800;
                                    color:#2A398D;line-height:1;margin-bottom:4px;">
                                  %d%%
                                </span>
                                <span style="font-size:10px;text-transform:uppercase;
                                    letter-spacing:0.5px;color:#888;">
                                  Efectividad ronda
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <!-- Card: Puntos acumulados -->
                        <td style="width:33%%;padding:0 5px;">
                          <table width="100%%" cellpadding="0" cellspacing="0"
                              style="background:#f8f9fa;border:1px solid #e0e0e0;
                              border-radius:10px;text-align:center;">
                            <tr>
                              <td style="padding:16px 10px;">
                                <span style="display:block;font-size:32px;font-weight:800;
                                    color:#2A398D;line-height:1;margin-bottom:4px;">
                                  %d
                                </span>
                                <span style="font-size:10px;text-transform:uppercase;
                                    letter-spacing:0.5px;color:#888;">
                                  Puntos acumulados
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>

                      </tr>
                    </table>

                    <!-- Info planilla -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                        style="margin-bottom:22px;background:#f8f9fa;
                        border:1px solid #e0e0e0;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:12px;color:#888;
                              text-transform:uppercase;letter-spacing:0.5px;
                              margin-bottom:3px;">Tu planilla</p>
                          <p style="margin:0;font-size:20px;font-weight:800;
                              color:#2A398D;font-family:monospace;">
                            #%d
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Diploma (solo ronda 3 y top 3) -->
                    %s

                    <!-- Link a posiciones -->
                    <table width="100%%" cellpadding="0" cellspacing="0"
                        style="margin-bottom:22px;">
                      <tr>
                        <td style="padding:0 5px;">
                          <table width="100%%" cellpadding="0" cellspacing="0"
                              style="background:#f8f9fa;border:1px solid #e0e0e0;
                              border-radius:8px;text-align:center;">
                            <tr>
                              <td style="padding:14px 10px;">
                                <div style="font-size:22px;margin-bottom:6px;">🏆</div>
                                <a href="%s/posiciones"
                                   style="display:block;font-size:12px;font-weight:700;
                                   color:#2A398D;text-decoration:none;margin-bottom:3px;">
                                  Tabla de Posiciones
                                </a>
                                <span style="font-size:10px;color:#888;line-height:1.4;">
                                  Mirá cómo estás en el ranking
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding:0 5px;">
                          <table width="100%%" cellpadding="0" cellspacing="0"
                              style="background:#f8f9fa;border:1px solid #e0e0e0;
                              border-radius:8px;text-align:center;">
                            <tr>
                              <td style="padding:14px 10px;">
                                <div style="font-size:22px;margin-bottom:6px;">📊</div>
                                <a href="%s/estadisticas"
                                   style="display:block;font-size:12px;font-weight:700;
                                   color:#2A398D;text-decoration:none;margin-bottom:3px;">
                                  Estadísticas
                                </a>
                                <span style="font-size:10px;color:#888;line-height:1.4;">
                                  Cómo pronosticó cada uno
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding:0 5px;">
                          <table width="100%%" cellpadding="0" cellspacing="0"
                              style="background:#f8f9fa;border:1px solid #e0e0e0;
                              border-radius:8px;text-align:center;">
                            <tr>
                              <td style="padding:14px 10px;">
                                <div style="font-size:22px;margin-bottom:6px;">👥</div>
                                <a href="%s/participantes"
                                   style="display:block;font-size:12px;font-weight:700;
                                   color:#2A398D;text-decoration:none;margin-bottom:3px;">
                                  Participantes
                                </a>
                                <span style="font-size:10px;color:#888;line-height:1.4;">
                                  Todos los que están en carrera
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Mensaje final -->
                    <table width="100%%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#2A398D 0%%,#1a237e 100%%);
                            border-radius:10px;padding:20px 24px;text-align:center;">
                          <p style="margin:0 0 6px;font-size:22px;">🏆</p>
                          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.9);
                              line-height:1.7;">
                            %s
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8f9fa;padding:20px 32px;
                      border-top:1px solid #e0e0e0;text-align:center;">
                    <p style="margin:0;font-size:11px;color:#9e9e9e;line-height:1.8;">
                      Este correo fue enviado automáticamente.<br>
                      <strong>Prode Mundial 2026</strong>
                      · Canadá · Estados Unidos · México<br>
                      <a href="%s"
                         style="color:#2A398D;text-decoration:none;font-weight:600;">
                        prode-mundial-2026.web.app
                      </a>
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(
        subtitulo,
        nombreCompleto,
        mensajeIntro,
        badgeBg, badgeColor, badgeColor,
        aciertosRonda,
        badgeColor,
        pct,
        puntosTotal,
        codigoPlanilla,
        seccionDiploma,
        BASE_URL,
        BASE_URL,
        BASE_URL,
        mensajeFinal,
        BASE_URL);
  }

  // ── Sección diploma (incrustada en ronda 3) ───────────────────────────────

  /**
   * Genera el bloque HTML del diploma para insertar dentro del email de ronda 3.
   * Respeta el estilo visual del resto del email (mismas fuentes, bordes,
   * radios).
   */
  private String buildDiplomaSection(
      String nombreCompleto,
      Long codigoPlanilla,
      int puesto,
      int puntosTotal) {

    String medallaEmoji, puestoLabel, borderColor, accentColor,
        badgeBg, badgeText, tituloCinta, mensajeCuerpo;

    switch (puesto) {
      case 1 -> {
        medallaEmoji = "🏆";
        puestoLabel = "🥇 CAMPEÓN";
        borderColor = "#D4AF37";
        accentColor = "#B8860B";
        badgeBg = "#FFF8DC";
        badgeText = "#8B6914";
        tituloCinta = "¡CAMPEÓN DEL PRODE!";
        mensajeCuerpo = "Sos el mejor pronosticador del torneo. "
            + "Terminaste en la cima con <strong>" + puntosTotal + " puntos</strong>. "
            + "¡Un resultado increíble!";
      }
      case 2 -> {
        medallaEmoji = "🥈";
        puestoLabel = "🥈 SUBCAMPEÓN";
        borderColor = "#A8A9AD";
        accentColor = "#606060";
        badgeBg = "#F5F5F5";
        badgeText = "#505050";
        tituloCinta = "¡SUBCAMPEÓN DEL PRODE!";
        mensajeCuerpo = "Estuviste muy cerca de la cima. "
            + "Terminaste en el segundo puesto con <strong>" + puntosTotal + " puntos</strong>. "
            + "¡Un torneo para enmarcar!";
      }
      default -> {
        medallaEmoji = "🥉";
        puestoLabel = "🥉 TERCER PUESTO";
        borderColor = "#CD7F32";
        accentColor = "#8B4513";
        badgeBg = "#FDF0E0";
        badgeText = "#7B4200";
        tituloCinta = "¡TERCER PUESTO EN EL PRODE!";
        mensajeCuerpo = "¡Excelente torneo! "
            + "Cerraste en el tercer puesto con <strong>" + puntosTotal + " puntos</strong>. "
            + "¡Un logro que pocos pueden decir que lograron!";
      }
    }

    return """
        <!-- ══ DIPLOMA (solo top 3, ronda 3) ══ -->
        <table width="100%%" cellpadding="0" cellspacing="0"
            style="margin-bottom:22px;
                   border:3px solid %s;
                   border-radius:12px;
                   overflow:hidden;">

          <!-- Cinta de puesto -->
          <tr>
            <td style="background:%s;padding:8px 20px;text-align:center;">
              <span style="font-size:12px;font-weight:800;letter-spacing:3px;
                  color:%s;text-transform:uppercase;font-family:Arial,sans-serif;">
                %s
              </span>
            </td>
          </tr>

          <!-- Cuerpo del diploma -->
          <tr>
            <td style="background:#FDFCF7;padding:28px 32px;text-align:center;">

              <!-- Línea decorativa superior -->
              <table width="100%%" cellpadding="0" cellspacing="0"
                  style="margin-bottom:20px;">
                <tr>
                  <td style="border-top:1px solid %s;"></td>
                  <td width="24" style="text-align:center;padding:0 8px;">
                    <span style="color:%s;font-size:11px;">✦</span>
                  </td>
                  <td style="border-top:1px solid %s;"></td>
                </tr>
              </table>

              <!-- Medalla y título -->
              <p style="margin:0 0 4px;font-size:48px;line-height:1;">%s</p>
              <p style="margin:0 0 4px;font-size:30px;letter-spacing:7px;
                  color:#2A398D;font-family:Georgia,serif;font-weight:700;
                  text-transform:uppercase;">
                DIPLOMA
              </p>

              <!-- Línea dorada -->
              <table width="50%%" cellpadding="0" cellspacing="0"
                  style="margin:8px auto 16px;">
                <tr>
                  <td style="border-top:2px solid %s;"></td>
                </tr>
              </table>

              <!-- Texto de otorgamiento -->
              <p style="margin:0 0 4px;font-size:12px;color:#666;
                  font-family:Arial,sans-serif;letter-spacing:0.5px;">
                Se otorga el presente diploma a
              </p>
              <p style="margin:0 0 14px;font-size:24px;font-weight:700;
                  color:#2A398D;font-family:Georgia,serif;">
                %s
              </p>
              <p style="margin:0 0 18px;font-size:12px;color:#555;
                  font-family:Arial,sans-serif;line-height:1.6;">
                por haber alcanzado el
                <strong style="color:%s;">%s</strong>
                en el Prode Mundial 2026.
              </p>

              <!-- Badge de puntos -->
              <table cellpadding="0" cellspacing="0"
                  style="margin:0 auto 16px;background:%s;
                         border:2px solid %s;border-radius:10px;">
                <tr>
                  <td style="padding:10px 28px;text-align:center;">
                    <p style="margin:0;font-size:10px;letter-spacing:2px;
                        text-transform:uppercase;color:%s;
                        font-family:Arial,sans-serif;font-weight:700;">
                      Puntaje Final
                    </p>
                    <p style="margin:2px 0 0;font-size:30px;font-weight:800;
                        color:%s;line-height:1;font-family:Arial,sans-serif;">
                      %d pts
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Línea decorativa inferior -->
              <table width="100%%" cellpadding="0" cellspacing="0"
                  style="margin-bottom:16px;">
                <tr>
                  <td style="border-top:1px solid %s;"></td>
                  <td width="24" style="text-align:center;padding:0 8px;">
                    <span style="color:%s;font-size:11px;">✦</span>
                  </td>
                  <td style="border-top:1px solid %s;"></td>
                </tr>
              </table>

              <!-- Mensaje personalizado -->
              <p style="margin:0;font-size:12px;color:#555;
                  font-family:Arial,sans-serif;line-height:1.7;">
                %s
              </p>

            </td>
          </tr>

          <!-- Footer del diploma -->
          <tr>
            <td style="background:%s;padding:10px 20px;text-align:center;">
              <span style="font-size:10px;letter-spacing:2px;color:%s;
                  font-family:Arial,sans-serif;text-transform:uppercase;font-weight:700;">
                PRODE MUNDIAL 2026 · ORGANIZACIÓN OFICIAL
              </span>
            </td>
          </tr>

        </table>
        <!-- ══ FIN DIPLOMA ══ -->
        """.formatted(
        borderColor, // borde exterior del diploma
        badgeBg, badgeText, tituloCinta, // cinta de puesto
        borderColor, accentColor, borderColor, // línea deco superior
        medallaEmoji, // medalla
        borderColor, // línea bajo "DIPLOMA"
        nombreCompleto, // nombre
        accentColor, puestoLabel, // texto mérito
        badgeBg, borderColor, badgeText, accentColor, // badge puntos
        puntosTotal, // número de puntos
        borderColor, accentColor, borderColor, // línea deco inferior
        mensajeCuerpo, // mensaje personalizado
        badgeBg, badgeText // footer del diploma
    );
  }

  // ── Utilidad ──────────────────────────────────────────────────────────────

  private long toLong(Object obj) {
    if (obj == null)
      return 0L;
    if (obj instanceof Long l)
      return l;
    if (obj instanceof Integer i)
      return i.longValue();
    if (obj instanceof Number n)
      return n.longValue();
    return 0L;
  }
}