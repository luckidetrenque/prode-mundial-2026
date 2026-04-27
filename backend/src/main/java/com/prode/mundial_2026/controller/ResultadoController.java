package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.ResultadoDTO;
import com.prode.mundial_2026.dto.ResultadoRequestDTO;
import com.prode.mundial_2026.model.Partido;
import com.prode.mundial_2026.model.Prediccion;
import com.prode.mundial_2026.model.Resultado;
import com.prode.mundial_2026.repository.PartidoRepository;
import com.prode.mundial_2026.repository.ResultadoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resultados")
@RequiredArgsConstructor
public class ResultadoController {

    private final ResultadoRepository resultadoRepository;
    private final PartidoRepository partidoRepository;

    // ── FIX SEG #4 ──────────────────────────────────────────────────────────
    // Devolvemos ResultadoDTO en lugar de la entidad Resultado cruda,
    // para no exponer el ID interno ni los campos de Hibernate.
    // ────────────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<ResultadoDTO>> listar() {
        List<ResultadoDTO> dtos = resultadoRepository.findAllWithPartido()
                .stream()
                .map(r -> new ResultadoDTO(
                        new ResultadoDTO.PartidoResumenDTO(
                                r.getPartido().getId(),
                                r.getPartido().getNumero()),
                        r.getResultado().name()))
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // PUT /api/resultados/{partidoId} → carga o actualiza un resultado (admin)
    @PutMapping("/{partidoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResultadoDTO> guardar(
            @PathVariable Long partidoId,
            @Valid @RequestBody ResultadoRequestDTO request) {

        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado: " + partidoId));

        Resultado resultado = resultadoRepository
                .findByPartidoId(partidoId)
                .orElse(new Resultado());

        resultado.setPartido(partido);
        resultado.setResultado(
                Prediccion.ResultadoPrediccion.valueOf(request.getResultado()));

        Resultado guardado = resultadoRepository.save(resultado);

        return ResponseEntity.ok(new ResultadoDTO(
                new ResultadoDTO.PartidoResumenDTO(
                        guardado.getPartido().getId(),
                        guardado.getPartido().getNumero()),
                guardado.getResultado().name()));
    }
}
