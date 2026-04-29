// Lo que Angular manda al hacer POST /api/auth/login
package com.prode.mundial_2026.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoginRequestDTO {

    // @NotNull → Spring valida que estos campos vengan en el JSON
    @NotNull(message = "El email es obligatorio")
    private String email;

    @NotNull(message = "La contraseña es obligatoria")
    private String password;
}