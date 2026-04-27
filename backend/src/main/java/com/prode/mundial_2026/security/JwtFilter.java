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

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.esTokenValido(token)) {
            System.out.println("DEBUG JWT: Token inválido o expirado");
            filterChain.doFilter(request, response);
            return;
        }

        Integer afiliado = jwtUtil.extraerAfiliado(token);
        Usuario admin = usuarioRepository.findByAfiliado(afiliado).orElse(null);

        if (admin == null) {
            System.out.println("DEBUG JWT: Usuario no encontrado para afiliado: " + afiliado);
            filterChain.doFilter(request, response);
            return;
        }

        if (!admin.getEsAdmin()) {
            System.out.println("DEBUG JWT: Usuario " + afiliado + " no tiene permisos de ADMIN");
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
            System.out.println("DEBUG JWT: Versión de token no coincide. Token: " + tokenVersion + ", DB: " + admin.getTokenVersion());
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println("DEBUG JWT: Autenticando usuario " + admin.getAfiliado() + " como ROLE_ADMIN");

        var autenticacion = new UsernamePasswordAuthenticationToken(
                admin,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(autenticacion);

        filterChain.doFilter(request, response);
    }
}
