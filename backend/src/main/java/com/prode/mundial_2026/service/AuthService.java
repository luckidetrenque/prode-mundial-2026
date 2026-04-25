package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.LoginRequestDTO;
import com.prode.mundial_2026.dto.LoginResponseDTO;
import com.prode.mundial_2026.model.Usuario;
import com.prode.mundial_2026.repository.UsuarioRepository;
import com.prode.mundial_2026.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// @Service → indica que esta clase contiene lógica de negocio
// Spring la gestiona como un componente singleton
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponseDTO login(LoginRequestDTO request) {

        // 1. Buscamos al usuario por número de afiliado
        Usuario usuario = usuarioRepository
                .findByAfiliado(request.getAfiliado())
                .orElseThrow(() -> new RuntimeException("Credenciales incorrectas"));

        // 2. Verificamos que sea admin
        if (!usuario.getEsAdmin()) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        // 3. Verificamos la password con BCrypt
        // passwordEncoder.matches() compara el texto plano con el hash guardado
        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        // 4. Generamos el token JWT
        String token = jwtUtil.generarToken(usuario.getAfiliado());

        return new LoginResponseDTO(token, usuario.getNombre(), usuario.getApellido());
    }
}
