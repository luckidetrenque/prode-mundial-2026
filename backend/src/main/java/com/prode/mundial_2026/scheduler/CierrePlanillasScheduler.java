package com.prode.mundial_2026.scheduler;

import com.prode.mundial_2026.service.EmailCierreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler de cierre de inscripción.
 *
 * Dispara el envío masivo de emails UNA sola vez:
 * el 10 de junio de 2026 a las 14:00 hs (hora Argentina, UTC-3).
 *
 * El cron "0 0 17 10 6 ?" equivale a las 14:00 ARG (UTC-3)
 * asumiendo que el servidor (Render) corre en UTC.
 * Si Render corre en UTC-3 o configurás TZ=America/Argentina/Buenos_Aires
 * en las variables de entorno, cambiá a "0 0 14 10 6 ?".
 *
 * IMPORTANTE: @EnableScheduling ya está activado en Mundial2026Application,
 * por lo que este componente funciona sin ningún cambio adicional.
 *
 * El método delega inmediatamente en EmailCierreService (@Async),
 * por lo que el hilo del scheduler queda libre en microsegundos.
 *
 * No hay ninguna interacción con EmailService — el envío al confirmar
 * planillas individuales sigue funcionando exactamente igual que antes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CierrePlanillasScheduler {

    private final EmailCierreService emailCierreService;

    /**
     * Cron: segundos minutos horas día-mes mes día-semana
     *
     * "0 0 17 10 6 ?"  →  10 de junio, 17:00 UTC = 14:00 Argentina (UTC-3)
     *
     * Si el servidor tiene TZ=America/Argentina/Buenos_Aires configurada,
     * usá en su lugar: "0 0 14 10 6 ?"
     */
    @Scheduled(cron = "0 0 17 10 6 ?")
    public void ejecutarCierrePlanillas() {
        log.info("[CIERRE] Scheduler disparado — 10/06/2026 14:00 ARG. " +
                 "Iniciando envío masivo de emails de cierre...");
        // Llama a @Async → retorna inmediatamente, el envío corre en otro hilo
        emailCierreService.enviarEmailsMasivosCierre();
    }
}
