package com.prode.mundial_2026.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

/**
 * DTO para editar las predicciones de una planilla existente.
 * El usuario debe proveer su código y email para verificar identidad.
 * Solo se permite editar planillas NO confirmadas.
 * Nota: la validación del conteo exacto de predicciones (72) se hace
 * en el service, no con @Size, para mayor flexibilidad y mensajes claros.
 */
@Data
public class EditarPlanillaRequestDTO {

    @NotNull(message = "El código de planilla es obligatorio")
    private Long codigo;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Debe ser un email válido")
    private String email;

    @NotEmpty(message = "Debe incluir al menos una predicción")
    private List<PlanillaRequestDTO.PrediccionItemDTO> predicciones;
}
