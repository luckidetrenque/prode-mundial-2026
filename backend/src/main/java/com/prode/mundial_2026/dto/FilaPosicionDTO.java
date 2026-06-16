package com.prode.mundial_2026.dto;

import lombok.Data;

@Data
public class FilaPosicionDTO {
    private String nombreEquipo;
    private int puntos;
    private int partidosJugados;
    private int partidosGanados;
    private int partidosEmpatados;
    private int partidosPerdidos;
    private int golesFavor;
    private int golesContra;
    private int diferenciaGoles;
    private String banderaUrl;
}
