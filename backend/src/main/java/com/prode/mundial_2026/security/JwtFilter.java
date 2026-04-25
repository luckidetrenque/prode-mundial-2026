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

// OncePerRequestFilter garantiza que este filtro se ejecute una sola vez por request
// @RequiredArgsConstructor (Lombok) genera el constructor con los campos final
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

        // 1. Buscamos el header "Authorization: Bearer <token>"
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // No hay token → continuamos sin autenticar (endpoints públicos pasan igual)
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extraemos el token (quitamos el prefijo "Bearer ")
        String token = authHeader.substring(7);

        // 3. Validamos el token
        if (!jwtUtil.esTokenValido(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Extraemos el afiliado del token y buscamos al admin en la DB
        Integer afiliado = jwtUtil.extraerAfiliado(token);
        Usuario admin = usuarioRepository.findByAfiliado(afiliado).orElse(null);

        if (admin == null || !admin.getEsAdmin()) {
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Autenticamos al usuario en el contexto de seguridad de Spring
        // Esto le dice a Spring: "este request viene de un admin autenticado"
        var autenticacion = new UsernamePasswordAuthenticationToken(
                admin,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(autenticacion);

        filterChain.doFilter(request, response);
    }
}
