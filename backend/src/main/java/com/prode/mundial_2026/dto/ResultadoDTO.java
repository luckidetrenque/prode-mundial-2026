package com.prode.mundial_2026.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

// ── FIX SEG #4 ──────────────────────────────────────────────────────────────
// En lugar de devolver la entidad Resultado directamente (que expone el ID
// interno y cualquier campo de Hibernate), usamos este DTO controlado.
// ─────────────────────────────────────────────────────────────────────────────
@Data
@AllArgsConstructor
public class ResultadoDTO {

    // Solo exponemos lo que necesita el frontend
    private PartidoResumenDTO partido;
    private String resultado; // "LOCAL" | "EMPATE" | "VISITANTE"
    private Integer golesLocal;
    private Integer golesVisitante;

    @Data
    @AllArgsConstructor
    public static class PartidoResumenDTO {
        private Long id;
        private Integer numero;
    }
}
