package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.PlanillaResponseDTO;
import com.prode.mundial_2026.repository.PlanillaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PlanillaRepository planillaRepository;

    // GET /api/admin/planillas → Lista TODAS las planillas para gestión del admin
    @GetMapping("/planillas")
    public ResponseEntity<List<PlanillaResponseDTO>> listarTodasLasPlanillas() {
        List<PlanillaResponseDTO> response = planillaRepository.findAllWithUsuario()
                .stream()
                .map(p -> new PlanillaResponseDTO(
                        p.getCodigo(),
                        p.getUsuario().getNombre(),
                        p.getUsuario().getApellido(),
                        p.getUsuario().getAfiliado(),
                        p.getConfirmada(),
                        "ID Interno: " + p.getId()))
                .toList();
        return ResponseEntity.ok(response);
    }
}
