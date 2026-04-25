package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.PlanillaRequestDTO;
import com.prode.mundial_2026.dto.PlanillaResponseDTO;
import com.prode.mundial_2026.model.*;
import com.prode.mundial_2026.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanillaService {

    private final PlanillaRepository planillaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PartidoRepository partidoRepository;

    // @Transactional → si algo falla, deshace todos los cambios en la DB
    // Garantiza que no queden datos a medias (ej: usuario sin planilla)
    @Transactional
    public PlanillaResponseDTO guardarPlanilla(PlanillaRequestDTO request) {

        // 1. Verificar que el afiliado no tenga planilla confirmada
        if (planillaRepository.existsByAfiliado(request.getAfiliado())) {
            throw new RuntimeException(
                    "Ya existe una planilla confirmada para el afiliado N° " + request.getAfiliado());
        }

        // 2. Crear o recuperar el usuario participante
        Usuario usuario = usuarioRepository
                .findByAfiliado(request.getAfiliado())
                .orElseGet(() -> {
                    Usuario nuevo = new Usuario();
                    nuevo.setNombre(request.getNombre().toUpperCase());
                    nuevo.setApellido(request.getApellido().toUpperCase());
                    nuevo.setAfiliado(request.getAfiliado());
                    nuevo.setEsAdmin(false);
                    return usuarioRepository.save(nuevo);
                });

        // 3. Crear la planilla con un código único basado en el timestamp
        Planilla planilla = new Planilla();
        planilla.setUsuario(usuario);
        planilla.setCodigo(System.currentTimeMillis());
        planilla.setConfirmada(false);

        // 4. Agregar las predicciones a la planilla
        for (PlanillaRequestDTO.PrediccionItemDTO item : request.getPredicciones()) {

            Partido partido = partidoRepository.findById(item.getPartidoId())
                    .orElseThrow(() -> new RuntimeException(
                            "Partido no encontrado: ID " + item.getPartidoId()));

            Prediccion prediccion = new Prediccion();
            prediccion.setPlanilla(planilla);
            prediccion.setPartido(partido);
            prediccion.setPrediccion(
                    Prediccion.ResultadoPrediccion.valueOf(item.getPrediccion()));

            // Agregamos la predicción a la lista de la planilla
            // Como tenemos CascadeType.ALL, se guardará junto con la planilla
            planilla.getPredicciones().add(prediccion);
        }

        // 5. Guardar todo en la DB (planilla + predicciones en una sola operación)
        planillaRepository.save(planilla);

        return new PlanillaResponseDTO(
                planilla.getCodigo(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getAfiliado(),
                planilla.getConfirmada(),
                "Planilla guardada correctamente. Código: " + planilla.getCodigo());
    }

    public PlanillaResponseDTO obtenerPorCodigo(Long codigo) {
        Planilla planilla = planillaRepository
                .findByCodigo(codigo)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

        return new PlanillaResponseDTO(
                planilla.getCodigo(),
                planilla.getUsuario().getNombre(),
                planilla.getUsuario().getApellido(),
                planilla.getUsuario().getAfiliado(),
                planilla.getConfirmada(),
                null);
    }

    public List<PlanillaResponseDTO> listarConfirmadas() {
        return planillaRepository.findByConfirmadaTrueOrderByIdAsc()
                .stream()
                .map(p -> new PlanillaResponseDTO(
                        p.getCodigo(),
                        p.getUsuario().getNombre(),
                        p.getUsuario().getApellido(),
                        p.getUsuario().getAfiliado(),
                        p.getConfirmada(),
                        null))
                .toList();
    }

    @Transactional
    public void confirmarPlanilla(Long id) {
        Planilla planilla = planillaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));
        planilla.setConfirmada(true);
        // No hace falta llamar a save() porque @Transactional detecta el cambio
        // y lo persiste automáticamente al cerrar la transacción (dirty checking)
    }
}
