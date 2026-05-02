package com.prode.mundial_2026.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * FIX #6: El mapa de contadores ahora se limpia automáticamente cada 5 minutos
 * mediante @Scheduled para evitar el memory leak que ocurría cuando el mapa
 * crecía indefinidamente con cada IP distinta que hacía una petición.
 *
 * FIX #10: Se agrega soporte configurable de proxies confiables.
 * Si no hay proxy configurado, X-Forwarded-For se ignora completamente
 * para evitar que clientes maliciosos falsifiquen su IP y salteen el rate
 * limit.
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_INTENTOS = 10;
    private static final int VENTANA_SEGUNDOS = 60;

    // FIX #6: tipo explícito long[] = {intentos, timestampPrimerIntento}
    private final Map<String, long[]> contadores = new ConcurrentHashMap<>();

    /**
     * FIX #10: Lista de IPs de proxies/load-balancers confiables.
     * Solo si la petición viene de una de estas IPs se respeta X-Forwarded-For.
     * Configurar en application.properties:
     * app.trusted-proxies=10.0.0.1,10.0.0.2
     * Si está vacío, X-Forwarded-For se ignora siempre.
     */
    @Value("${app.trusted-proxies:}")
    private Set<String> trustedProxies;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if (!"/api/auth/login".equals(request.getRequestURI())
                || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = obtenerIp(request);
        long ahora = Instant.now().getEpochSecond();

        long[] estado = contadores.compute(ip, (k, v) -> {
            if (v == null) {
                return new long[] { 1, ahora };
            }
            long intentos = v[0];
            long primerIntento = v[1];

            if (ahora - primerIntento > VENTANA_SEGUNDOS) {
                return new long[] { 1, ahora };
            }
            return new long[] { intentos + 1, primerIntento };
        });

        if (estado[0] > MAX_INTENTOS) {
            long segundosRestantes = VENTANA_SEGUNDOS - (ahora - estado[1]);
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"error\":\"Demasiados intentos de login. Intentá en "
                            + Math.max(0, segundosRestantes) + " segundos.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * FIX #6: Limpieza periódica del mapa para evitar memory leak.
     * Elimina entradas cuya ventana de tiempo ya expiró.
     * Se ejecuta cada 5 minutos.
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void limpiarContadoresExpirados() {
        long ahora = Instant.now().getEpochSecond();
        contadores.entrySet().removeIf(entry -> ahora - entry.getValue()[1] > VENTANA_SEGUNDOS);
    }

    /**
     * FIX #10: X-Forwarded-For solo se respeta si la petición llega
     * desde un proxy confiable configurado explícitamente.
     * Evita que cualquier cliente falsifique su IP con ese header.
     */
    private String obtenerIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        if (!trustedProxies.isEmpty() && trustedProxies.contains(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }

        return remoteAddr;
    }
}