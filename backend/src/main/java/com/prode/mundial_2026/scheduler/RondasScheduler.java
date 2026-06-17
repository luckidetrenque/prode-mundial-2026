package com.prode.mundial_2026.scheduler;

import com.prode.mundial_2026.service.EmailRondaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Scheduler de emails de cierre de ronda.
 *
 * Dispara tres verificaciones independientes:
 *
 *   Ronda 1 — partidos 1–24   (jornada=1)
 *     · Último partido: #24
 *     · Fecha mínima de envío: 18/06/2026 10:00 hs ARG
 *     · Cron UTC: 0 0 13 18 6 ?  (13:00 UTC = 10:00 ARG UTC-3)
 *     · Condición extra: 24 resultados de jornada=1 cargados
 *
 *   Ronda 2 — partidos 25–48  (jornada=2)
 *     · Último partido: #48
 *     · Fecha mínima de envío: 24/06/2026 10:00 hs ARG
 *     · Cron UTC: 0 0 13 24 6 ?
 *     · Condición extra: 24 resultados de jornada=2 cargados
 *
 *   Ronda 3 — partidos 49–72  (jornada=3)
 *     · Último partido: #72
 *     · Fecha mínima de envío: 28/06/2026 10:00 hs ARG
 *     · Cron UTC: 0 0 13 28 6 ?
 *     · Condición extra: 24 resultados de jornada=3 cargados
 *
 * El cron solo "habilita la ventana" — la validación real de los 24
 * resultados la hace EmailRondaService.procesarRonda() antes de enviar.
 *
 * Si el servidor tiene TZ=America/Argentina/Buenos_Aires configurada,
 * reemplazá los cron por "0 0 10 DD 6 ?" (sin ajuste UTC).
 *
 * Frecuencia de reintento: cada hora hasta que EmailRondaService
 * confirme los 24 resultados cargados o detecte que ya se envió.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RondasScheduler {

    private final EmailRondaService emailRondaService;

    // ── Fechas límite ARG (usadas para validación en el método) ──────────────

    /** 18/06/2026 10:00 hs ARG */
    private static final LocalDateTime FECHA_MIN_RONDA_1 =
            LocalDateTime.of(2026, 6, 18, 10, 0);

    /** 24/06/2026 10:00 hs ARG */
    private static final LocalDateTime FECHA_MIN_RONDA_2 =
            LocalDateTime.of(2026, 6, 24, 10, 0);

    /** 28/06/2026 10:00 hs ARG */
    private static final LocalDateTime FECHA_MIN_RONDA_3 =
            LocalDateTime.of(2026, 6, 28, 10, 0);

    private static final ZoneId ZONA_ARG = ZoneId.of("America/Argentina/Buenos_Aires");

    // ── Ronda 1 ───────────────────────────────────────────────────────────────

    /**
     * Cron: a partir del 18/06 10:00 ARG, cada hora entre las 10:00 y 22:00 ARG.
     * UTC-3 → 13:00–01:00 UTC.
     *
     * "0 0 13-23,0,1 18-30 6 ?" no es estándar en Spring cron (6 campos).
     * Solución pragmática: disparar cada hora desde el 18/6 al 22/6
     * y dejar que el método valide la fecha mínima y el flag de ya-enviado.
     *
     * Cron Spring (6 campos): segundos minutos horas día mes día-semana
     * "0 0 * 18-22 6 ?"  → cada hora, del 18 al 22 de junio
     */
    @Scheduled(cron = "0 0 * 18-22 6 ?")
    public void verificarRonda1() {
        LocalDateTime ahoraArg = LocalDateTime.now(ZONA_ARG);
        if (ahoraArg.isBefore(FECHA_MIN_RONDA_1)) {
            log.debug("[RONDA 1] Aún no es la fecha mínima ({}).", FECHA_MIN_RONDA_1);
            return;
        }
        log.info("[RONDA 1] Verificando condiciones de envío...");
        emailRondaService.procesarRonda(1, 1, "Primera");
    }

    // ── Ronda 2 ───────────────────────────────────────────────────────────────

    /**
     * "0 0 * 24-27 6 ?"  → cada hora, del 24 al 27 de junio
     */
    @Scheduled(cron = "0 0 * 24-27 6 ?")
    public void verificarRonda2() {
        LocalDateTime ahoraArg = LocalDateTime.now(ZONA_ARG);
        if (ahoraArg.isBefore(FECHA_MIN_RONDA_2)) {
            log.debug("[RONDA 2] Aún no es la fecha mínima ({}).", FECHA_MIN_RONDA_2);
            return;
        }
        log.info("[RONDA 2] Verificando condiciones de envío...");
        emailRondaService.procesarRonda(2, 2, "Segunda");
    }

    // ── Ronda 3 ───────────────────────────────────────────────────────────────

    /**
     * "0 0 * 28,29,30 6 ?"  → cada hora, del 28 al 30 de junio
     */
    @Scheduled(cron = "0 0 * 28-30 6 ?")
    public void verificarRonda3() {
        LocalDateTime ahoraArg = LocalDateTime.now(ZONA_ARG);
        if (ahoraArg.isBefore(FECHA_MIN_RONDA_3)) {
            log.debug("[RONDA 3] Aún no es la fecha mínima ({}).", FECHA_MIN_RONDA_3);
            return;
        }
        log.info("[RONDA 3] Verificando condiciones de envío...");
        emailRondaService.procesarRonda(3, 3, "Tercera");
    }
}
