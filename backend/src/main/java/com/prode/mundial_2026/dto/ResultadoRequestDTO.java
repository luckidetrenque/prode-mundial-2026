// Lo que el admin manda al cargar un resultado
package com.prode.mundial_2026.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResultadoRequestDTO {

    @NotNull(message = "El resultado es obligatorio")
    @Pattern(regexp = "LOCAL|EMPATE|VISITANTE", message = "El resultado debe ser LOCAL, EMPATE o VISITANTE")
    private String resultado;

    @jakarta.validation.constraints.Min(value = 0, message = "Los goles no pueden ser negativos")
    private Integer golesLocal;

    @jakarta.validation.constraints.Min(value = 0, message = "Los goles no pueden ser negativos")
    private Integer golesVisitante;
}