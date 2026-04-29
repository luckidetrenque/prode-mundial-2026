// Lo que el backend devuelve después de un login exitoso
package com.prode.mundial_2026.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDTO {
    @JsonIgnore
    private String token;
    private String nombre;
    private String apellido;
}