package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.PlanillaRequestDTO;
import com.prode.mundial_2026.dto.PlanillaResponseDTO;
import com.prode.mundial_2026.service.PlanillaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planillas")
@RequiredArgsConstructor
public class PlanillaController {

    private final PlanillaService planillaService;

    // POST /api/planillas → guarda una nueva planilla (público)
    @PostMapping
    public ResponseEntity<PlanillaResponseDTO> guardar(
            @Valid @RequestBody PlanillaRequestDTO request) {
        PlanillaResponseDTO response = planillaService.guardarPlanilla(request);
        // 201 Created es más semántico que 200 OK cuando creamos un recurso
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET /api/planillas → lista planillas confirmadas (público)
    @GetMapping
    public ResponseEntity<List<PlanillaResponseDTO>> listar() {
        return ResponseEntity.ok(planillaService.listarConfirmadas());
    }

    // GET /api/planillas/{codigo} → ver una planilla por código (público)
    @GetMapping("/{codigo}")
    public ResponseEntity<PlanillaResponseDTO> obtener(@PathVariable Long codigo) {
        return ResponseEntity.ok(planillaService.obtenerPorCodigo(codigo));
    }

    // PUT /api/planillas/{id}/confirmar → confirma una planilla (solo admin)
    // @PreAuthorize → Spring Security verifica el rol ANTES de ejecutar el método
    @PutMapping("/{id}/confirmar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> confirmar(@PathVariable Long id) {
        planillaService.confirmarPlanilla(id);
        return ResponseEntity.ok().build();
    }
}