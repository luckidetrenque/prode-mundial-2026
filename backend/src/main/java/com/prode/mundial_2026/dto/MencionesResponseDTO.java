// backend/src/main/java/com/prode/mundial_2026/dto/MencionesResponseDTO.java
package com.prode.mundial_2026.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MencionesResponseDTO {
    private List<MencionDTO> menciones;
    private LocalDateTime ultimaActualizacion;
    private boolean hayDatos; // false si no hay resultados cargados aún
}