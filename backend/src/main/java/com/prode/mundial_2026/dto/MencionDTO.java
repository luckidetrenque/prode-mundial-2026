// backend/src/main/java/com/prode/mundial_2026/dto/MencionDTO.java
package com.prode.mundial_2026.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MencionDTO {

    private String tipo; // "EL_ADIVINO", "DIAMANTE", etc.
    private String emoji;
    private String titulo;
    private String descripcion;
    private List<ParticipanteResumenDTO> participantes;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ParticipanteResumenDTO {
        private String nombre;
        private String apellido;
        private Long codigoPlanilla;
    }
}