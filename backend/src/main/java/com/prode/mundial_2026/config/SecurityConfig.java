package com.prode.mundial_2026.config;

import com.prode.mundial_2026.security.JwtFilter;
import com.prode.mundial_2026.security.LoginRateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final LoginRateLimitFilter loginRateLimitFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOriginsRaw;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/partidos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/resultados/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/posiciones/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/estadisticas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/planillas/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/planillas").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/chatbot/ask").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/resultados/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/planillas/*/confirmar").hasRole("ADMIN")
                        .anyRequest().authenticated())
                /**
                 * FIX #15: El orden de addFilterBefore importa.
                 * Ambos filtros se agregaban "before UsernamePasswordAuthenticationFilter"
                 * sin garantía de orden entre ellos.
                 *
                 * Orden correcto garantizado:
                 * 1. LoginRateLimitFilter (corta brute force ANTES de cualquier procesamiento)
                 * 2. JwtFilter (autentica el token)
                 * 3. UsernamePasswordAuthenticationFilter (Spring Security)
                 *
                 * Se logra encadenando: loginRateLimitFilter before JwtFilter,
                 * y JwtFilter before UsernamePasswordAuthenticationFilter.
                 */
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(loginRateLimitFilter, JwtFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        /**
         * FIX #9: allowedHeaders("*") con allowCredentials(true) es inválido
         * según la spec CORS y algunos browsers lo rechazan.
         * Se listan los headers explícitamente necesarios.
         */
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Set-Cookie", "Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}