package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.LoginRequestDTO;
import com.prode.mundial_2026.dto.LoginResponseDTO;
import com.prode.mundial_2026.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @RestController = @Controller + @ResponseBody
//   → todos los métodos devuelven JSON automáticamente
// @RequestMapping → prefijo de la URL para todos los endpoints de este controller
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login
    // @RequestBody → Spring deserializa el JSON del body en LoginRequestDTO
    // @Valid → dispara las validaciones de @NotNull, @Pattern, etc.
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }
}