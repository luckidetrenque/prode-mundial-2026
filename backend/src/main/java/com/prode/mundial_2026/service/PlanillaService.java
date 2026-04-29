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

        @Transactional
        public PlanillaResponseDTO guardarPlanilla(PlanillaRequestDTO request) {

                // if (planillaRepository.existsByEmail(request.getEmail())) {
                // throw new RuntimeException(
                // "Ya existe una planilla para el email: " + request.getEmail());
                // }

                Usuario usuario = usuarioRepository
                                .findByEmail(request.getEmail())
                                .orElseGet(() -> {
                                        Usuario nuevo = new Usuario();
                                        nuevo.setNombre(request.getNombre().toUpperCase());
                                        nuevo.setApellido(request.getApellido().toUpperCase());
                                        nuevo.setEmail(request.getEmail());
                                        nuevo.setEsAdmin(false);
                                        return usuarioRepository.save(nuevo);
                                });

                Planilla planilla = new Planilla();
                planilla.setUsuario(usuario);
                planilla.setCodigo(System.currentTimeMillis());
                planilla.setConfirmada(false);

                for (PlanillaRequestDTO.PrediccionItemDTO item : request.getPredicciones()) {
                        Partido partido = partidoRepository.findById(item.getPartidoId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Partido no encontrado: ID " + item.getPartidoId()));

                        Prediccion prediccion = new Prediccion();
                        prediccion.setPlanilla(planilla);
                        prediccion.setPartido(partido);
                        prediccion.setPrediccion(
                                        Prediccion.ResultadoPrediccion.valueOf(item.getPrediccion()));
                        planilla.getPredicciones().add(prediccion);
                }

                planillaRepository.save(planilla);

                return new PlanillaResponseDTO(
                                planilla.getCodigo(),
                                usuario.getNombre(),
                                usuario.getApellido(),
                                usuario.getEmail(),
                                planilla.getConfirmada(),
                                "Planilla guardada correctamente. Código: " + planilla.getCodigo(),
                                null); // No es necesario devolverlas al guardar
        }

        public PlanillaResponseDTO obtenerPorCodigo(Long codigo) {
                Planilla planilla = planillaRepository
                                .findByCodigo(codigo)
                                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

                return new PlanillaResponseDTO(
                                planilla.getCodigo(),
                                planilla.getUsuario().getNombre(),
                                planilla.getUsuario().getApellido(),
                                planilla.getUsuario().getEmail(),
                                planilla.getConfirmada(),
                                null,
                                mapearPredicciones(planilla.getPredicciones()));
        }

        public List<PlanillaResponseDTO> listarConfirmadas() {
                return planillaRepository.findByConfirmadaTrueOrderByIdAsc()
                                .stream()
                                .map(p -> new PlanillaResponseDTO(
                                                p.getCodigo(),
                                                p.getUsuario().getNombre(),
                                                p.getUsuario().getApellido(),
                                                p.getUsuario().getEmail(),
                                                p.getConfirmada(),
                                                null,
                                                null)) // No las incluimos en el listado general por performance
                                .toList();
        }

        private List<PlanillaRequestDTO.PrediccionItemDTO> mapearPredicciones(List<Prediccion> predicciones) {
                return predicciones.stream()
                                .map(p -> {
                                        PlanillaRequestDTO.PrediccionItemDTO item = new PlanillaRequestDTO.PrediccionItemDTO();
                                        item.setPartidoId(p.getPartido().getId());
                                        item.setPrediccion(p.getPrediccion().name());
                                        return item;
                                })
                                .toList();
        }

        // ── FIX BUG #1 ────────────────────────────────────────────────────────────
        // El frontend envía el CÓDIGO de planilla (número visible al participante),
        // no el ID interno de la tabla. Usamos findByCodigo() en lugar de findById().
        // ─────────────────────────────────────────────────────────────────────────
        @Transactional
        public void confirmarPlanilla(Long codigo) {
                Planilla planilla = planillaRepository
                                .findByCodigo(codigo)
                                .orElseThrow(() -> new RuntimeException(
                                                "Planilla no encontrada con código: " + codigo));
                planilla.setConfirmada(true);
                // @Transactional hace dirty-checking automático — no hace falta save()
        }
}
