package com.prode.mundial_2026.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// ── FIX SEG #5 ────────────────────────────────────────────────────────────────
// Rate limiting en memoria para el endpoint /api/auth/login.
// Bloquea una IP que acumula más de MAX_INTENTOS en VENTANA_SEGUNDOS segundos.
//
// Para producción con múltiples instancias, reemplazar el ConcurrentHashMap
// por Redis (spring-boot-starter-data-redis + RedisTemplate).
// ─────────────────────────────────────────────────────────────────────────────
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_INTENTOS     = 10;  // intentos máximos
    private static final int VENTANA_SEGUNDOS = 60;  // ventana de tiempo

    // IP → [cantidad de intentos, timestamp del primer intento en la ventana]
    private final Map<String, long[]> contadores = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Solo aplica al endpoint de login con método POST
        if (!"/api/auth/login".equals(request.getRequestURI())
                || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = obtenerIp(request);
        long ahora = Instant.now().getEpochSecond();

        long[] estado = contadores.compute(ip, (k, v) -> {
            if (v == null) {
                // Primera vez que vemos esta IP
                return new long[]{1, ahora};
            }
            long intentos   = v[0];
            long primerIntento = v[1];

            if (ahora - primerIntento > VENTANA_SEGUNDOS) {
                // Ventana expirada → reiniciar contador
                return new long[]{1, ahora};
            }
            // Dentro de la ventana → incrementar
            return new long[]{intentos + 1, primerIntento};
        });

        if (estado[0] > MAX_INTENTOS) {
            long segundosRestantes = VENTANA_SEGUNDOS - (ahora - estado[1]);
            response.setStatus(429); // 429 no está en la spec antigua; usamos 429 explícito
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"error\":\"Demasiados intentos de login. Intentá en "
                    + Math.max(0, segundosRestantes) + " segundos.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    // Respeta el header X-Forwarded-For cuando hay un proxy/load balancer adelante
    private String obtenerIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
