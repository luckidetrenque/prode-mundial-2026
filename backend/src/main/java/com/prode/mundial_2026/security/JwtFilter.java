package com.prode.mundial_2026.security;

import com.prode.mundial_2026.model.Usuario;
import com.prode.mundial_2026.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = null;
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("prode_token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        if (token == null || !jwtUtil.esTokenValido(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = jwtUtil.extraerEmail(token);
        Usuario admin = usuarioRepository.findByEmail(email).orElse(null);

        if (admin == null || !admin.getEsAdmin()) {
            filterChain.doFilter(request, response);
            return;
        }

        // ── FIX SEG #1 ────────────────────────────────────────────────────────
        // Comparamos la versión del token contra la versión actual en la DB.
        // Si no coinciden (porque el admin hizo logout), rechazamos el token
        // aunque sea criptográficamente válido y no haya expirado.
        // ─────────────────────────────────────────────────────────────────────
        int tokenVersion = jwtUtil.extraerTokenVersion(token);
        if (tokenVersion != admin.getTokenVersion()) {
            // Token revocado — continuamos sin autenticar
            filterChain.doFilter(request, response);
            return;
        }

        var autenticacion = new UsernamePasswordAuthenticationToken(
                admin,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(autenticacion);

        filterChain.doFilter(request, response);
    }
}
