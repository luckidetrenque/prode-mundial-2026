package com.prode.mundial_2026.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FIX #20: El token se marcaba con @JsonIgnore porque va en la cookie HttpOnly,
 * no en el body JSON. Sin embargo, el campo existía en el DTO y se pasaba
 * al constructor, lo que generaba confusión: ¿el token va en el body o no?
 *
 * Solución: se mantiene @JsonIgnore (el token nunca llega al cliente en el
 * body)
 * y se documenta explícitamente el flujo para que no haya ambigüedad.
 *
 * Flujo:
 * 1. AuthService genera el token y lo pasa a este DTO.
 * 2. AuthController lee el token con getToken() y lo setea en la cookie
 * HttpOnly.
 * 3. El body JSON que recibe el frontend solo contiene { nombre, apellido }.
 * 4. El token NUNCA aparece en el JSON de respuesta (Jackson lo ignora).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDTO {

    /**
     * Token JWT — solo para uso interno del AuthController.
     * 
     * @JsonIgnore garantiza que no se serialice en la respuesta HTTP.
     *             El cliente nunca lo ve en el body; lo recibe como cookie
     *             HttpOnly.
     */
    @JsonIgnore
    private String token;

    /** Nombre del admin, incluido en el body para mostrarlo en la UI. */
    private String nombre;

    /** Apellido del admin, incluido en el body para mostrarlo en la UI. */
    private String apellido;
}