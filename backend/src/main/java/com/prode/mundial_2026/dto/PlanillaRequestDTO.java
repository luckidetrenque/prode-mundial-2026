// Lo que Angular manda al hacer POST /api/planillas
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

    @NotNull(message = "El número de afiliado es obligatorio")
    @Min(value = 1, message = "El número de afiliado debe ser mayor a 0")
    private Integer afiliado;

    // Lista de predicciones, una por cada partido de la fase de grupos
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