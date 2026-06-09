package com.prode.mundial_2026.service;

import com.prode.mundial_2026.model.Planilla;
import com.prode.mundial_2026.repository.PlanillaRepository;
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
import java.util.List;

/**
 * Servicio de email masivo de cierre de inscripción.
 *
 * Responsabilidad única: enviar UN email a cada participante confirmado
 * al cierre del período (10/06/2026 14:00 hs), con:
 *   - Saludo personalizado y mensaje de agradecimiento (tuteo)
 *   - Cards de stats
 *   - Links a Participantes y Estadísticas del sitio
 *   - Tabla de todos los participantes en 3 columnas
 *   - Mensaje de buena suerte
 *
 * No modifica ni llama a EmailService — ambos coexisten sin interferencias.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailCierreService {

    private final JavaMailSender mailSender;
    private final PlanillaRepository planillaRepository;

    private static final String BASE_URL = "https://prode-mundial-2026-62343.web.app";

    @Value("${app.email.from}")
    private String emailFrom;

    @Value("${app.email.from-name}")
    private String emailFromName;

    // ── Punto de entrada público ──────────────────────────────────────────────

    /**
     * Envía el email de cierre a TODOS los participantes confirmados.
     *
     * Estrategia: carga UNA sola vez la lista, construye UNA sola vez los
     * bloques HTML compartidos (tabla + links), y personaliza solo el saludo
     * para cada destinatario. Así se evitan N queries a la DB.
     */
    @Async
    @Transactional(readOnly = true)
    public void enviarEmailsMasivosCierre() {
        log.info("[CIERRE] Iniciando envío masivo de emails de cierre...");

        List<Planilla> confirmadas = planillaRepository.findByConfirmadaTrueOrderByIdAsc();

        if (confirmadas.isEmpty()) {
            log.warn("[CIERRE] No hay planillas confirmadas. No se enviaron emails.");
            return;
        }

        int total = confirmadas.size();
        log.info("[CIERRE] {} planillas confirmadas. Iniciando envío...", total);

        // Bloques HTML compartidos — se construyen una sola vez
        String tablaHtml  = buildTablaParticipantesHtml(confirmadas);
        String statsHtml  = buildStatsHtml(total);
        String linksHtml  = buildLinksHtml();

        int enviados = 0;
        int errores  = 0;

        for (Planilla planilla : confirmadas) {
            String email          = planilla.getUsuario().getEmail();
            String nombreCompleto = planilla.getUsuario().getNombre()
                    + " " + planilla.getUsuario().getApellido();
            try {
                enviarEmailCierre(email, nombreCompleto, statsHtml, tablaHtml, linksHtml);
                enviados++;
                log.info("[CIERRE] OK → {} (planilla {})", email, planilla.getCodigo());
            } catch (Exception e) {
                errores++;
                log.error("[CIERRE] ERROR → {} (planilla {}): {}",
                        email, planilla.getCodigo(), e.getMessage());
            }
        }

        log.info("[CIERRE] Finalizado. Enviados: {} | Errores: {}", enviados, errores);
    }

    // ── Envío individual ──────────────────────────────────────────────────────

    private void enviarEmailCierre(
            String destino,
            String nombreCompleto,
            String statsHtml,
            String tablaHtml,
            String linksHtml)
            throws MessagingException, UnsupportedEncodingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(emailFrom, emailFromName);
        helper.setTo(destino);
        helper.setSubject("⚽ Prode Mundial 2026 — ¡Inscripción cerrada! Lista de participantes");
        helper.setText(buildEmailHtml(nombreCompleto, statsHtml, tablaHtml, linksHtml), true);

        mailSender.send(message);
    }

    // ── HTML completo del email ───────────────────────────────────────────────

    private String buildEmailHtml(
            String nombreCompleto,
            String statsHtml,
            String tablaHtml,
            String linksHtml) {

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
                        <div style="height:3px;background:#d4a017;margin:16px -32px 0;"></div>
                      </td>
                    </tr>

                    <!-- Cuerpo -->
                    <tr>
                      <td style="padding:28px 32px;">

                        <!-- Saludo personalizado -->
                        <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#2A398D;">
                          ¡Hola, %s!
                        </p>

                        <!-- Mensaje de apertura -->
                        <p style="margin:0 0 8px;font-size:13px;color:#474A4A;line-height:1.75;">
                          El período de inscripción del <strong>Prode Mundial 2026</strong>
                          cerró el <strong>10 de junio a las 14:00 hs</strong>.
                          Gracias por participar — ¡ya sos parte del torneo!
                        </p>
                        <p style="margin:0 0 22px;font-size:13px;color:#474A4A;line-height:1.75;">
                          Abajo encontrás la lista completa de todos los que se anotaron.
                          A partir de ahora podés seguir los resultados, la tabla de posiciones
                          y las estadísticas en tiempo real desde el sitio.
                        </p>

                        <!-- Stats -->
                        <table width="100%%" cellpadding="0" cellspacing="0"
                            style="margin-bottom:22px;">
                          <tr>%s</tr>
                        </table>

                        <!-- Links al sitio -->
                        %s

                        <!-- Etiqueta sección -->
                        <p style="margin:0 0 10px;font-size:10px;font-weight:700;
                            text-transform:uppercase;letter-spacing:1px;color:#888;
                            padding-bottom:8px;border-bottom:1px solid #e8e8e8;">
                          Participantes confirmados
                        </p>

                        <!-- Tabla 3 columnas -->
                        %s

                        <!-- Mensaje de buena suerte -->
                        <table width="100%%" cellpadding="0" cellspacing="0"
                            style="margin-top:22px;">
                          <tr>
                            <td style="background:linear-gradient(135deg,#2A398D 0%%,#1a237e 100%%);
                                border-radius:10px;padding:20px 24px;text-align:center;">
                              <p style="margin:0 0 6px;font-size:22px;">🏆</p>
                              <p style="margin:0 0 8px;font-size:15px;font-weight:700;
                                  color:#ffffff;letter-spacing:0.3px;">
                                ¡Mucha suerte en el torneo!
                              </p>
                              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.75);
                                  line-height:1.6;">
                                Que tus predicciones sean certeras y que disfrutes cada partido.<br>
                                ¡Ojalá sea tu año!
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
                          Este correo fue enviado automáticamente al cierre de la inscripción.<br>
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
                nombreCompleto,
                statsHtml,
                linksHtml,
                tablaHtml,
                BASE_URL
        );
    }

    // ── Stats cards ───────────────────────────────────────────────────────────

    private String buildStatsHtml(int totalConfirmadas) {
        return buildStatCell(String.valueOf(totalConfirmadas), "Planillas confirmadas")
             + buildStatCell("72", "Partidos por jugar")
             + buildStatCell("11/06", "Inicio del torneo");
    }

    private String buildStatCell(String numero, String etiqueta) {
        return """
            <td style="width:33%%;padding:0 5px;">
              <table width="100%%" cellpadding="0" cellspacing="0"
                  style="background:#f8f9fa;border:1px solid #e0e0e0;
                  border-radius:8px;text-align:center;">
                <tr>
                  <td style="padding:14px 10px;">
                    <span style="display:block;font-size:26px;font-weight:700;
                        color:#2A398D;line-height:1;margin-bottom:4px;">%s</span>
                    <span style="font-size:10px;text-transform:uppercase;
                        letter-spacing:0.5px;color:#888;">%s</span>
                  </td>
                </tr>
              </table>
            </td>
            """.formatted(numero, etiqueta);
    }

    // ── Links al sitio ────────────────────────────────────────────────────────

    private String buildLinksHtml() {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0"
                style="margin-bottom:22px;">
              <tr>
                <td style="padding:0 5px;">
                  %s
                </td>
                <td style="padding:0 5px;">
                  %s
                </td>
                <td style="padding:0 5px;">
                  %s
                </td>
              </tr>
            </table>
            """.formatted(
                buildLinkCard("👥", "Participantes",
                    "Mirá quién está en carrera",
                    BASE_URL + "/participantes"),
                buildLinkCard("📊", "Estadísticas",
                    "Cómo pronosticó cada uno",
                    BASE_URL + "/estadisticas"),
                buildLinkCard("🏆", "Posiciones",
                    "Seguí tu posición en vivo",
                    BASE_URL + "/posiciones")
        );
    }

    private String buildLinkCard(String emoji, String titulo, String descripcion, String url) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0"
                style="background:#f8f9fa;border:1px solid #e0e0e0;
                border-radius:8px;text-align:center;">
              <tr>
                <td style="padding:14px 10px;">
                  <div style="font-size:22px;margin-bottom:6px;">%s</div>
                  <a href="%s"
                     style="display:block;font-size:12px;font-weight:700;
                     color:#2A398D;text-decoration:none;margin-bottom:3px;">
                    %s
                  </a>
                  <span style="font-size:10px;color:#888;line-height:1.4;">
                    %s
                  </span>
                </td>
              </tr>
            </table>
            """.formatted(emoji, url, titulo, descripcion);
    }

    // ── Tabla de participantes en 3 columnas ──────────────────────────────────

    /**
     * Distribuye los participantes en 3 columnas de igual altura aproximada
     * para que el email no quede largo. Con 50 planillas → ~17 filas por columna.
     * Se construye una sola vez y se reutiliza para todos los destinatarios.
     */
    private String buildTablaParticipantesHtml(List<Planilla> confirmadas) {
        int total  = confirmadas.size();
        int COLS   = 3;
        int porCol = (int) Math.ceil((double) total / COLS);

        StringBuilder cols = new StringBuilder();

        for (int c = 0; c < COLS; c++) {
            int desde = c * porCol;
            int hasta = Math.min(desde + porCol, total);

            if (desde >= total) break; // menos de 3 columnas si hay pocos participantes

            StringBuilder filas = new StringBuilder();
            for (int i = desde; i < hasta; i++) {
                Planilla p    = confirmadas.get(i);
                String nombre = p.getUsuario().getNombre()
                        + " " + p.getUsuario().getApellido();
                String bg     = (i % 2 == 0) ? "#ffffff" : "#f9fafb";

                filas.append("""
                    <tr style="background:%s;">
                      <td style="padding:5px 6px;border-bottom:1px solid #f0f0f0;
                          font-size:10px;font-weight:700;color:#2A398D;
                          white-space:nowrap;width:20px;">%d</td>
                      <td style="padding:5px 6px;border-bottom:1px solid #f0f0f0;
                          font-size:10px;color:#474A4A;">%s</td>
                      <td style="padding:5px 6px;border-bottom:1px solid #f0f0f0;
                          font-size:10px;font-family:monospace;font-weight:700;
                          color:#2A398D;text-align:right;white-space:nowrap;">%d</td>
                    </tr>
                    """.formatted(bg, i + 1, nombre, p.getCodigo()));
            }

            cols.append("""
                <td style="padding:0 4px;vertical-align:top;width:33%%;">
                  <table width="100%%" cellpadding="0" cellspacing="0"
                      style="border-collapse:collapse;border:1px solid #e0e0e0;
                      border-radius:6px;overflow:hidden;">
                    <thead>
                      <tr>
                        <th style="background:#2A398D;color:#fff;padding:6px 6px;
                            font-size:9px;font-weight:600;letter-spacing:0.4px;
                            text-align:left;">#</th>
                        <th style="background:#2A398D;color:#fff;padding:6px 6px;
                            font-size:9px;font-weight:600;letter-spacing:0.4px;
                            text-align:left;">Nombre</th>
                        <th style="background:#2A398D;color:#fff;padding:6px 6px;
                            font-size:9px;font-weight:600;letter-spacing:0.4px;
                            text-align:right;">Planilla</th>
                      </tr>
                    </thead>
                    <tbody>%s</tbody>
                  </table>
                </td>
                """.formatted(filas.toString()));
        }

        return """
            <table width="100%%" cellpadding="0" cellspacing="0"
                style="margin-bottom:4px;">
              <tr>%s</tr>
            </table>
            """.formatted(cols.toString());
    }
}
