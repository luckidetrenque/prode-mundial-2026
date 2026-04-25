package com.prode.mundial_2026.config;

import com.prode.mundial_2026.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins; // "http://localhost:4200"

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Deshabilitamos CSRF porque usamos JWT (sin estado de sesión)
                .csrf(AbstractHttpConfigurer::disable)

                // Configuramos CORS (necesario para que Angular pueda llamar al backend)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Sin sesiones del lado del servidor; cada request se autentica con JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Definimos qué endpoints son públicos y cuáles requieren admin
                .authorizeHttpRequests(auth -> auth

                        // ── Endpoints públicos (sin token) ──────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/partidos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/resultados/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posiciones/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/estadisticas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/planillas/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/planillas").permitAll()

                        // ── Endpoints de admin (requieren token JWT) ─────────────────
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/resultados/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/planillas/*/confirmar").hasRole("ADMIN")

                        // Cualquier otro endpoint requiere autenticación
                        .anyRequest().authenticated())

                // Agregamos nuestro filtro JWT ANTES del filtro de autenticación
                // de Spring, para que procese el token antes que todo lo demás
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Configuración CORS: permite que Angular (puerto 4200) llame al backend
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    // BCrypt: algoritmo para cifrar las passwords de los admins
    // Nunca guardamos la password en texto plano
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
