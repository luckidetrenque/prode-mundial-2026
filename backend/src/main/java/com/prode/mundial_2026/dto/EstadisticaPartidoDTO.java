// Estadísticas de apuestas para un partido (para el gráfico de barras)
package com.prode.mundial_2026.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class EstadisticaPartidoDTO {
    private Integer numeroPartido;
    private String equipoLocal;
    private String equipoVisitante;
    private String grupo;
    private Long votosLocal;
    private Long votosEmpate;
    private Long votosVisitante;
    private Long totalVotos;
}