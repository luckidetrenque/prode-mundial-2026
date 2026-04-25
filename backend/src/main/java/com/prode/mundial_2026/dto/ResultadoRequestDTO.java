// Lo que el admin manda al cargar un resultado
package com.prode.mundial_2026.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResultadoRequestDTO {

    @NotNull(message = "El id del partido es obligatorio")
    private Long partidoId;

    @NotNull(message = "El resultado es obligatorio")
    @Pattern(regexp = "LOCAL|EMPATE|VISITANTE", message = "El resultado debe ser LOCAL, EMPATE o VISITANTE")
    private String resultado;
}