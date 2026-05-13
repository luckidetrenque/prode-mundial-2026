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
        private final EmailService emailService; // NUEVO

        @Transactional
        public PlanillaResponseDTO guardarPlanilla(PlanillaRequestDTO request) {

                Usuario usuario = new Usuario();
                usuario.setNombre(request.getNombre().toUpperCase());
                usuario.setApellido(request.getApellido().toUpperCase());
                usuario.setEmail(request.getEmail());
                usuario.setEsAdmin(false);
                usuarioRepository.save(usuario);

                // Usuario usuario = usuarioRepository
                // .findByEmail(request.getEmail())
                // .orElseGet(() -> {
                // });

                Planilla planilla = new Planilla();
                planilla.setUsuario(usuario);
                planilla.setCodigo(generarCodigoUnico());
                planilla.setConfirmada(false);

                for (PlanillaRequestDTO.PrediccionItemDTO item : request.getPredicciones()) {
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
                Planilla planilla = planillaRepository
                                .findByCodigo(codigo)
                                .orElseThrow(() -> new BusinessException.PlanillaNotFoundException(codigo));

                if (planilla.getConfirmada()) {
                        throw new BusinessException.PlanillaYaConfirmadaException(codigo);
                }

                planilla.setConfirmada(true);
                // @Transactional hace dirty-checking automático — no hace falta save()

                // Enviamos los emails de forma asíncrona.
                // Se hace DENTRO de la transacción para que las predicciones estén cargadas
                // en el contexto de Hibernate antes del commit.
                // EmailService usa @Async, así que retorna inmediatamente y no bloquea.
                emailService.enviarEmailsConfirmacion(planilla);
        }

        private Long generarCodigoUnico() {
                for (int intento = 0; intento < 5; intento++) {
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
