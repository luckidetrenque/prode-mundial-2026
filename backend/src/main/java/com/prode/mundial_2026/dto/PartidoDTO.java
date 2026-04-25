// Lo que Angular recibe al pedir GET /api/partidos
package com.prode.mundial_2026.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PartidoDTO {
    private Long id;
    private Integer numero;
    private String equipoLocalNombre;
    private String equipoLocalShow;
    private String equipoLocalBandera;
    private String equipoVisitanteNombre;
    private String equipoVisitanteShow;
    private String equipoVisitanteBandera;
    private String fase;
    private String grupo;
    private Integer jornada;
    private LocalDateTime fechaHora;
    private String sede;
}