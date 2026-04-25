// Lo que el backend devuelve después de un login exitoso
package com.prode.mundial_2026.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String token; // JWT que Angular guardará en localStorage
    private String nombre;
    private String apellido;
}