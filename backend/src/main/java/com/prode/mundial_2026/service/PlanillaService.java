package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.PlanillaRequestDTO;
import com.prode.mundial_2026.dto.PlanillaResponseDTO;
import com.prode.mundial_2026.exception.BusinessException;
import com.prode.mundial_2026.model.*;
import com.prode.mundial_2026.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PlanillaService {

        private final PlanillaRepository planillaRepository;
        private final UsuarioRepository usuarioRepository;
        private final PartidoRepository partidoRepository;

        @Transactional
        public PlanillaResponseDTO guardarPlanilla(PlanillaRequestDTO request) {

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

                /**
                 * FIX #12: System.currentTimeMillis() como código único era inseguro.
                 *
                 * Problemas del enfoque anterior:
                 * 1. Race condition: dos requests en el mismo milisegundo generaban
                 * el mismo código → excepción de constraint en DB.
                 * 2. Predecible: cualquiera podía adivinar códigos de otros participantes
                 * basándose en el timestamp Unix.
                 *
                 * Solución: número aleatorio de 8 dígitos con verificación de unicidad.
                 * Si colisiona (muy improbable con pocos miles de planillas), reintenta.
                 * Para mayor escala se recomienda una secuencia de DB (SEQUENCE de PostgreSQL).
                 */
                planilla.setCodigo(generarCodigoUnico());
                planilla.setConfirmada(false);

                for (PlanillaRequestDTO.PrediccionItemDTO item : request.getPredicciones()) {
                        // FIX #11: lanza BusinessException tipada en lugar de RuntimeException genérica
                        Partido partido = partidoRepository.findById(item.getPartidoId())
                                        .orElseThrow(() -> new BusinessException.PartidoNotFoundException(
                                                        item.getPartidoId()));

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
                                null);
        }

        public PlanillaResponseDTO obtenerPorCodigo(Long codigo) {
                // FIX #11: excepción tipada con mensaje controlado
                Planilla planilla = planillaRepository
                                .findByCodigo(codigo)
                                .orElseThrow(() -> new BusinessException.PlanillaNotFoundException(codigo));

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
                                                null))
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

        @Transactional
        public void confirmarPlanilla(Long codigo) {
                // FIX #11: excepción tipada
                Planilla planilla = planillaRepository
                                .findByCodigo(codigo)
                                .orElseThrow(() -> new BusinessException.PlanillaNotFoundException(codigo));

                if (planilla.getConfirmada()) {
                        throw new BusinessException.PlanillaYaConfirmadaException(codigo);
                }

                planilla.setConfirmada(true);
                // @Transactional hace dirty-checking automático
        }

        /**
         * FIX #12: Genera un código numérico de 8 dígitos único.
         * Reintenta hasta 5 veces en caso de colisión (extremadamente improbable).
         * Si tras 5 intentos persiste la colisión, lanza excepción controlada.
         */
        private Long generarCodigoUnico() {
                for (int intento = 0; intento < 5; intento++) {
                        // Rango: 10_000_000 a 99_999_999 (8 dígitos)
                        long codigo = ThreadLocalRandom.current().nextLong(10_000_000L, 100_000_000L);
                        if (!planillaRepository.existsByCodigo(codigo)) {
                                return codigo;
                        }
                }
                throw new BusinessException(
                                "No se pudo generar un código único. Intentá nuevamente.",
                                org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
        }
}