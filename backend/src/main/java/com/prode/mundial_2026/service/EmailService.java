package com.prode.mundial_2026.service;

import com.prode.mundial_2026.model.Planilla;
import com.prode.mundial_2026.model.Prediccion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Map;
import java.io.UnsupportedEncodingException;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;
  private final com.prode.mundial_2026.repository.PlanillaRepository planillaRepository;

  @Value("${app.email.from}")
  private String emailFrom;

  @Value("${app.email.from-name}")
  private String emailFromName;

  /**
   * Envía los dos emails al participante cuando su planilla es confirmada:
   * 1. Email con el reglamento completo
   * 2. Email con sus predicciones
   *
   * Se ejecuta de forma asíncrona para no bloquear la respuesta HTTP del admin.
   *
   * IMPORTANTE: recargamos la planilla con un JOIN FETCH completo porque el
   * contexto de Hibernate de la transacción original ya cerró. Si accediéramos
   * a planilla.getPredicciones() directamente obtendríamos
   * LazyInitializationException.
   */
  @Async
  public void enviarEmailsConfirmacion(Planilla planilla) {
    // Recarga con todas las asociaciones necesarias para los emails
    Planilla planillaCompleta = planillaRepository
        .findByCodigoWithPredicciones(planilla.getCodigo())
        .orElse(planilla); // fallback: usa la que viene (puede fallar si lazy)

    String emailDestino = planillaCompleta.getUsuario().getEmail();
    String nombreCompleto = planillaCompleta.getUsuario().getNombre() + " "
        + planillaCompleta.getUsuario().getApellido();

    try {
      enviarEmailReglamento(emailDestino, nombreCompleto, planillaCompleta.getCodigo());
      log.info("Email reglamento enviado a {} (planilla {})", emailDestino, planillaCompleta.getCodigo());
      System.out.println("Mail enviado con éxito");
    } catch (Exception e) {
      log.error("Error enviando email reglamento a {} (planilla {}): {}",
          emailDestino, planillaCompleta.getCodigo(), e.getMessage());
      e.printStackTrace();
    }

    try {
      enviarEmailPlanilla(emailDestino, nombreCompleto, planillaCompleta);
      log.info("Email planilla enviado a {} (planilla {})", emailDestino, planillaCompleta.getCodigo());
    } catch (Exception e) {
      log.error("Error enviando email planilla a {} (planilla {}): {}",
          emailDestino, planillaCompleta.getCodigo(), e.getMessage());
    }
  }

  // ── Email 1: Reglamento ────────────────────────────────────────────────

  private void enviarEmailReglamento(String destino, String nombreCompleto, Long codigoPlanilla)
      throws MessagingException, UnsupportedEncodingException {

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom(emailFrom, emailFromName);
    helper.setTo(destino);
    helper.setSubject("🏆 Prode Mundial 2026 — Reglamento Oficial");
    helper.setText(buildReglamentoHtml(nombreCompleto, codigoPlanilla), true);

    mailSender.send(message);
  }

  private String buildReglamentoHtml(String nombreCompleto, Long codigoPlanilla) {
    return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background:#f2f4f5;font-family:'DM Sans',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f5;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#2A398D 0%%,#1a237e 100%%);padding:36px 40px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">⚽</div>
                    <h1 style="margin:0;font-family:Arial,sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">
                      PRODE MUNDIAL 2026
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">
                      Canadá · Estados Unidos · México
                    </p>
                  </td>
                </tr>

                <!-- Saludo -->
                <tr>
                  <td style="padding:36px 40px 0;">
                    <h2 style="margin:0 0 16px;font-size:22px;color:#2A398D;">
                      ¡Hola, %s! 👋
                    </h2>
                    <p style="margin:0 0 12px;font-size:15px;color:#474A4A;line-height:1.6;">
                      Tu planilla <strong style="color:#c0171d;">#%d</strong> fue <strong>confirmada exitosamente</strong>.
                      A continuación encontrás el reglamento completo del Prode.
                    </p>
                    <div style="background:#e8f8ef;border-left:4px solid #1a7a4a;border-radius:0 8px 8px 0;padding:12px 16px;margin:20px 0;">
                      <p style="margin:0;font-size:13px;color:#1a7a4a;font-weight:600;">
                        ✅ Planilla confirmada — Código: <span style="font-size:18px;font-family:monospace;">#%d</span>
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Reglamento -->
                <tr>
                  <td style="padding:24px 40px;">

                    <table width="100%%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#2A398D;padding:12px 20px;border-radius:8px 8px 0 0;">
                          <h3 style="margin:0;font-size:16px;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">
                            📋 Reglamento Oficial
                          </h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;padding:0;">

                          %s

                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e0e0e0;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9e9e9e;line-height:1.8;">
                      Prode Mundial 2026 — Canadá · Estados Unidos · México<br/>
                      11 de junio – 19 de julio de 2026
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """
        .formatted(
            nombreCompleto,
            codigoPlanilla,
            codigoPlanilla,
            buildArticulosHtml());
  }

  private String buildArticulosHtml() {
    record Articulo(String numero, String titulo, String icono, String contenido, String destacado) {
    }

    List<Articulo> articulos = List.of(
        new Articulo("1", "Partidos", "⚽",
            "Son los <strong>SETENTA Y DOS (72) partidos</strong> que se jugarán en la fase de grupos del Mundial de Fútbol 2026, iniciando el día <strong>jueves 11 de junio de 2026</strong> y culminando el día <strong>jueves 28 de junio de 2026</strong>. El torneo se disputará en estadios de <strong>Canadá, Estados Unidos y México</strong>.",
            null),
        new Articulo("2", "Planilla", "📋",
            "La planilla cuenta con los <strong>SETENTA Y DOS (72) partidos</strong> de la fase de grupos. Solo se puede marcar: equipo <strong>Local (L)</strong>, equipo <strong>Visitante (V)</strong> o <strong>Empate (E)</strong> por cada partido.",
            "Se admite <strong>más de una planilla</strong> por participante. Día y hora de finalización: <strong>10/06/2026 - 14:00 hs</strong>."),
        new Articulo("3", "Valor", "💵",
            "La planilla tiene un valor de <strong>PESOS CINCO MIL ($5.000)</strong> que deberá ser abonado de manera previa o al momento de confirmar la misma.",
            null),
        new Articulo("4", "Confirmación", "✅",
            "Para confirmar la planilla, se deberá presentar el <strong>número único de identificación</strong> generado por el sistema al momento de guardarla.",
            "Las planillas se confirmarán <strong>ineludiblemente</strong> hasta el <strong>10/06/2026 - 14:00 hs</strong>. Las planillas fuera de término no serán confirmadas."),
        new Articulo("5", "Publicación", "👥",
            "Las planillas debidamente confirmadas se publicarán en el sitio web una vez cerrado el período de inscripción.",
            null),
        new Articulo("6", "Resultados", "📊",
            "Serán considerados los <strong>resultados oficiales de la FIFA</strong> del Mundial 2026. Los resultados y la tabla de posiciones se actualizarán automáticamente en el sitio.",
            null),
        new Articulo("7", "Ganadores", "🏆",
            "Será ganador del <strong>Primer Puesto</strong> quien mayor puntaje acumule. En caso de empate, todos los participantes empatados son considerados ganadores y se reparten el premio. Lo mismo aplica para Segundo y Tercer Puesto.",
            "Cada predicción correcta vale <strong>1 punto</strong> o <strong>2 puntos</strong> si el partido tiene multiplicador X2."),
        new Articulo("8", "Premios", "🎁",
            "<strong>1° Puesto:</strong> 60%% del pozo recaudado.<br/><strong>2° Puesto:</strong> 30%% del pozo recaudado.<br/><strong>3° Puesto:</strong> 10%% del pozo recaudado.<br/>En caso de empate en cualquier puesto, el monto se divide en partes iguales.",
            null),
        new Articulo("9", "Entrega de Premios", "🤝",
            "Los premios serán entregados dentro de los <strong>5 días hábiles</strong> posteriores a la finalización de la fase de grupos del Mundial 2026.",
            null));

    StringBuilder sb = new StringBuilder();
    for (Articulo art : articulos) {
      sb.append(
          """
              <table width="100%%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f0f0f0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px;vertical-align:top;padding-top:2px;">
                          <span style="font-size:20px;">%s</span>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9e9e9e;">
                            ARTÍCULO %s
                          </p>
                          <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#2A398D;">%s</p>
                          <p style="margin:0;font-size:13px;color:#474A4A;line-height:1.7;">%s</p>
                          %s
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              """
              .formatted(
                  art.icono(), art.numero(), art.titulo(), art.contenido(),
                  art.destacado() != null
                      ? "<div style=\"background:#e8f4fd;border-left:3px solid #2A398D;border-radius:0 6px 6px 0;padding:8px 12px;margin-top:10px;\"><p style=\"margin:0;font-size:12px;color:#2A398D;line-height:1.6;\">ℹ️ "
                          + art.destacado() + "</p></div>"
                      : ""));
    }
    return sb.toString();
  }

  // ── Email 2: Planilla con predicciones ────────────────────────────────

  private void enviarEmailPlanilla(String destino, String nombreCompleto, Planilla planilla)
      throws MessagingException, UnsupportedEncodingException {

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom(emailFrom, emailFromName);
    helper.setTo(destino);
    helper.setSubject("⚽ Prode Mundial 2026 — Tu planilla #" + planilla.getCodigo());
    helper.setText(buildPlanillaHtml(nombreCompleto, planilla), true);

    mailSender.send(message);
  }

  private String buildPlanillaHtml(String nombreCompleto, Planilla planilla) {
    // Agrupamos predicciones por grupo
    Map<String, List<Prediccion>> porGrupo = planilla.getPredicciones().stream()
        .filter(p -> p.getPartido().getGrupo() != null)
        .sorted((a, b) -> Integer.compare(a.getPartido().getNumero(), b.getPartido().getNumero()))
        .collect(Collectors.groupingBy(
            p -> p.getPartido().getGrupo(),
            Collectors.toList()));

    // Ordenamos los grupos alfabéticamente
    List<String> grupos = porGrupo.keySet().stream().sorted().toList();

    StringBuilder tablaHtml = new StringBuilder();
    for (String grupo : grupos) {
      tablaHtml.append(buildGrupoHtml(grupo, porGrupo.get(grupo)));
    }

    return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:0;background:#f2f4f5;font-family:'DM Sans',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f2f4f5;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#2A398D 0%%,#1a237e 100%%);padding:36px 40px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">⚽</div>
                    <h1 style="margin:0;font-family:Arial,sans-serif;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">
                      PRODE MUNDIAL 2026
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">
                      Tus predicciones
                    </p>
                  </td>
                </tr>

                <!-- Info planilla -->
                <tr>
                  <td style="padding:36px 40px 24px;">
                    <h2 style="margin:0 0 8px;font-size:22px;color:#2A398D;">
                      ¡Hola, %s! 🎉
                    </h2>
                    <p style="margin:0 0 20px;font-size:15px;color:#474A4A;line-height:1.6;">
                      Aquí están todas tus predicciones para la fase de grupos del Mundial 2026.
                      ¡Guardá este email como respaldo!
                    </p>

                    <!-- Badge código -->
                    <table cellpadding="0" cellspacing="0" style="background:#f2f4f5;border:2px dashed #c0171d;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 24px;text-align:center;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9e9e9e;">
                            Código de planilla
                          </p>
                          <p style="margin:0;font-family:monospace;font-size:32px;font-weight:700;color:#c0171d;letter-spacing:2px;">
                            #%d
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Predicciones por grupo -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    %s
                  </td>
                </tr>

                <!-- Leyenda -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <table cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:12px 16px;width:100%%;">
                      <tr>
                        <td>
                          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9e9e9e;">Leyenda</p>
                          <p style="margin:0;font-size:13px;color:#474A4A;">
                            <span style="background:#2e9e2d;color:white;padding:2px 8px;border-radius:4px;font-weight:700;margin-right:4px;">L</span> Gana Local &nbsp;&nbsp;
                            <span style="background:#2A398D;color:white;padding:2px 8px;border-radius:4px;font-weight:700;margin-right:4px;">E</span> Empate &nbsp;&nbsp;
                            <span style="background:#c0171d;color:white;padding:2px 8px;border-radius:4px;font-weight:700;margin-right:4px;">V</span> Gana Visitante &nbsp;&nbsp;
                            <span style="background:#ffc107;color:#856404;padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px;">⚡ X2</span> Partido doble puntaje
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e0e0e0;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9e9e9e;line-height:1.8;">
                      Prode Mundial 2026 — Canadá · Estados Unidos · México<br/>
                      11 de junio – 19 de julio de 2026
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """
        .formatted(
            nombreCompleto,
            planilla.getCodigo(),
            tablaHtml.toString());
  }

  private String buildGrupoHtml(String grupo, List<Prediccion> predicciones) {
    StringBuilder sb = new StringBuilder();

    sb.append(
        """
            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid #e0e0e0;">
              <tr>
                <td style="background:linear-gradient(to right,#2A398D,#3a4bb0);padding:10px 16px;">
                  <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.7);text-transform:uppercase;">GRUPO</p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;">%s</p>
                </td>
              </tr>
            """
            .formatted(grupo));

    for (Prediccion pred : predicciones) {
      String local = pred.getPartido().getEquipoLocal() != null
          ? pred.getPartido().getEquipoLocal().getNombreShow()
          : "TBD";
      String visitante = pred.getPartido().getEquipoVisitante() != null
          ? pred.getPartido().getEquipoVisitante().getNombreShow()
          : "TBD";
      boolean esX2 = pred.getPartido().getMultiplicador() != null
          && pred.getPartido().getMultiplicador() > 1;

      String resultado = pred.getPrediccion().name();
      String color = switch (resultado) {
        case "LOCAL" -> "#2e9e2d";
        case "EMPATE" -> "#2A398D";
        case "VISITANTE" -> "#c0171d";
        default -> "#666";
      };
      String label = switch (resultado) {
        case "LOCAL" -> "L";
        case "EMPATE" -> "E";
        case "VISITANTE" -> "V";
        default -> "?";
      };
      String descripcion = switch (resultado) {
        case "LOCAL" -> "Gana " + local;
        case "EMPATE" -> "Empate";
        case "VISITANTE" -> "Gana " + visitante;
        default -> "-";
      };

      sb.append(
          """
              <tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:10px 16px;">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:28px;font-size:11px;font-weight:700;color:#9e9e9e;vertical-align:middle;">#%d</td>
                      <td style="vertical-align:middle;padding:0 8px;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:13px;font-weight:600;color:#474A4A;text-align:right;padding-right:8px;">%s</td>
                            <td style="font-size:10px;color:#9e9e9e;white-space:nowrap;padding:0 4px;">vs</td>
                            <td style="font-size:13px;font-weight:600;color:#474A4A;padding-left:8px;">%s</td>
                            %s
                          </tr>
                        </table>
                      </td>
                      <td style="white-space:nowrap;text-align:right;vertical-align:middle;">
                        <span style="background:%s;color:white;font-weight:800;font-size:14px;width:28px;height:28px;border-radius:50%%;display:inline-block;line-height:28px;text-align:center;">%s</span>
                        <span style="font-size:12px;color:#474A4A;margin-left:8px;">%s</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              """
              .formatted(
                  pred.getPartido().getNumero(),
                  local,
                  visitante,
                  esX2 ? "<td style=\"padding-left:8px;\"><span style=\"background:#ffc107;color:#856404;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;\">⚡X2</span></td>"
                      : "",
                  color, label, descripcion));
    }

    sb.append("</table>");
    return sb.toString();
  }
}