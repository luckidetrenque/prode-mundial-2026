package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.LoginRequestDTO;
import com.prode.mundial_2026.dto.LoginResponseDTO;
import com.prode.mundial_2026.model.Usuario;
import com.prode.mundial_2026.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    /**
     * FIX #7: El flag "secure" de la cookie estaba hardcodeado a false.
     * Ahora se lee desde application.properties para que en producción
     * (HTTPS) se pueda activar con app.cookie.secure=true sin tocar código.
     * Valor por defecto: false (seguro para desarrollo local).
     */
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpServletResponse response) {

        LoginResponseDTO authResponse = authService.login(request);

        ResponseCookie cookie = ResponseCookie.from("prode_token", authResponse.getToken())
                .httpOnly(true)
                .secure(cookieSecure) // FIX #7: configurable por entorno
                .path("/")
                .maxAge(24 * 60 * 60) // 1 día
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal Usuario admin,
            HttpServletResponse response) {

        if (admin != null) {
            authService.logout(admin.getEmail());
        }

        // FIX #7: mismo flag para la cookie de borrado
        ResponseCookie cookie = ResponseCookie.from("prode_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.noContent().build();
    }
}