package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.LoginRequestDTO;
import com.prode.mundial_2026.dto.LoginResponseDTO;
import com.prode.mundial_2026.model.Usuario;
import com.prode.mundial_2026.repository.UsuarioRepository;
import com.prode.mundial_2026.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponseDTO login(LoginRequestDTO request) {

        Usuario usuario = usuarioRepository
                .findByAfiliado(request.getAfiliado())
                .orElseThrow(() -> new RuntimeException("Credenciales incorrectas"));

        if (!usuario.getEsAdmin()) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        // ── FIX SEG #1 ────────────────────────────────────────────────────────
        // Pasamos la tokenVersion actual al generador para que quede en el payload.
        // ─────────────────────────────────────────────────────────────────────
        String token = jwtUtil.generarToken(usuario.getAfiliado(), usuario.getTokenVersion());

        return new LoginResponseDTO(token, usuario.getNombre(), usuario.getApellido());
    }

    // ── FIX SEG #1 ────────────────────────────────────────────────────────────
    // Al hacer logout, incrementamos tokenVersion en la DB.
    // Cualquier JWT anterior queda inmediatamente inválido porque su "tv"
    // ya no coincide con el valor actual del usuario.
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void logout(Integer afiliado) {
        usuarioRepository.findByAfiliado(afiliado).ifPresent(usuario -> {
            usuario.setTokenVersion(usuario.getTokenVersion() + 1);
            // @Transactional hace dirty-checking — no hace falta save()
        });
    }
}
