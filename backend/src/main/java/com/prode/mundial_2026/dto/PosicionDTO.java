// Una fila de la tabla de posiciones
package com.prode.mundial_2026.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class PosicionDTO {
    private Integer posicion;
    private String nombre;
    private String apellido;
    private String email;
    private Long codigoPlanilla;
    private Integer puntos; // cantidad de partidos acertados
    private Integer totalPartidos; // partidos con resultado cargado
}