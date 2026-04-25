package com.prode.mundial_2026.controller;

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

    // GET /api/resultados → lista los resultados cargados (público)
    @GetMapping
    public ResponseEntity<List<Resultado>> listar() {
        return ResponseEntity.ok(resultadoRepository.findAllWithPartido());
    }

    // PUT /api/resultados/{partidoId} → carga o actualiza un resultado (admin)
    @PutMapping("/{partidoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resultado> guardar(
            @PathVariable Long partidoId,
            @Valid @RequestBody ResultadoRequestDTO request) {

        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado"));

        // Si ya existe un resultado para este partido, lo actualizamos
        // Si no existe, creamos uno nuevo
        Resultado resultado = resultadoRepository
                .findByPartidoId(partidoId)
                .orElse(new Resultado());

        resultado.setPartido(partido);
        resultado.setResultado(
                Prediccion.ResultadoPrediccion.valueOf(request.getResultado()));

        return ResponseEntity.ok(resultadoRepository.save(resultado));
    }
}