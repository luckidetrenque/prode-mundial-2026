package com.prode.mundial_2026.dto;

import lombok.Data;
import java.util.List;

@Data
public class GrupoPosicionesDTO {
    private String nombreGrupo;
    private List<FilaPosicionDTO> equipos;
}