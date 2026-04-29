package com.prode.mundial_2026.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class PlanillaRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50)
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 50)
    private String apellido;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Debe ser un email válido")
    private String email;

    // ── FIX BUG #3 ────────────────────────────────────────────────────────────
    // El Mundial 2026 tiene 12 grupos de 4 equipos = 72 partidos en fase de grupos (12 x 6).
    @NotEmpty(message = "Debe incluir predicciones")
    @Size(min = 72, max = 72, message = "Debe predecir exactamente los 72 partidos de la fase de grupos")
    private List<PrediccionItemDTO> predicciones;

    @Data
    public static class PrediccionItemDTO {
        @NotNull
        private Long partidoId;

        @NotNull
        @Pattern(regexp = "LOCAL|EMPATE|VISITANTE", message = "La predicción debe ser LOCAL, EMPATE o VISITANTE")
        private String prediccion;
    }
}
