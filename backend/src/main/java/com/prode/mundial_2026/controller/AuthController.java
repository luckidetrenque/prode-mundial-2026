package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.LoginRequestDTO;
import com.prode.mundial_2026.dto.LoginResponseDTO;
import com.prode.mundial_2026.model.Usuario;
import com.prode.mundial_2026.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request,
            HttpServletResponse response) {
        LoginResponseDTO authResponse = authService.login(request);

        ResponseCookie cookie = ResponseCookie.from("prode_token", authResponse.getToken())
                .httpOnly(true)
                .secure(false) // Cambiar a true en producción (HTTPS)
                .path("/")
                .maxAge(24 * 60 * 60) // 1 día
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(authResponse);
    }

    // ── FIX SEG #1 ────────────────────────────────────────────────────────────
    // POST /api/auth/logout → invalida el JWT actual incrementando tokenVersion.
    // El frontend ya borra el token de localStorage en auth.service.ts;
    // este endpoint asegura que el token no pueda reutilizarse en el servidor.
    //
    // Requiere estar autenticado (el JwtFilter ya extrajo al admin del token).
    // Si el token ya era inválido, Spring devuelve 403 antes de llegar aquí.
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Usuario admin, HttpServletResponse response) {
        if (admin != null) {
            authService.logout(admin.getEmail());
        }

        ResponseCookie cookie = ResponseCookie.from("prode_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.noContent().build();
    }
}
