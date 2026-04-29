// Lo que el backend devuelve después de guardar una planilla exitosamente
package com.prode.mundial_2026.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class PlanillaResponseDTO {
    private Long codigo; // número único de la planilla
    private String nombre;
    private String apellido;
    private String email;
    private Boolean confirmada;
    private String mensaje; // ej: "Planilla guardada correctamente"
    private java.util.List<PlanillaRequestDTO.PrediccionItemDTO> predicciones;
}