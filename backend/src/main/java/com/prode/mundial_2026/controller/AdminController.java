package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.PlanillaResponseDTO;
import com.prode.mundial_2026.repository.PlanillaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PlanillaRepository planillaRepository;

    /**
     * FIX #13 (original): paginación para evitar OOM con miles de planillas.
     *
     * FIX backend #3: La respuesta paginada no incluía el conteo real de
     * planillas PENDIENTES. El campo totalElements devuelve el total de TODAS
     * las planillas (confirmadas + pendientes), lo que hacía que el frontend
     * sobreestimara el número de pendientes cuando había páginas múltiples.
     *
     * Solución: se agrega el campo "totalPendientes" usando countPendientes()
     * que ya existía en el repositorio. Es una segunda query barata (COUNT)
     * que resuelve el problema sin cambiar la estructura paginada existente.
     *
     * El frontend (confirmar-planillas.component.ts) puede ahora usar
     * directamente data.totalPendientes para mostrar el conteo exacto,
     * sin estimaciones propias.
     *
     * Endpoint: GET /api/admin/planillas?page=0&size=100
     *
     * Respuesta:
     * {
     *   "content":          [...],        // planillas de esta página
     *   "totalElements":    N,            // total de planillas (todas)
     *   "totalPages":       N,
     *   "currentPage":      N,
     *   "pageSize":         N,
     *   "totalPendientes":  N             // NUEVO: solo las no confirmadas
     * }
     */
    @GetMapping("/planillas")
    public ResponseEntity<Map<String, Object>> listarTodasLasPlanillas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 500);

        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<com.prode.mundial_2026.model.Planilla> resultado =
                planillaRepository.findAllWithUsuarioPaged(pageable);

        List<PlanillaResponseDTO> content = resultado.getContent()
                .stream()
                .map(p -> new PlanillaResponseDTO(
                        p.getCodigo(),
                        p.getUsuario().getNombre(),
                        p.getUsuario().getApellido(),
                        p.getUsuario().getEmail(),
                        p.getConfirmada(),
                        "", null))
                .toList();

        // FIX backend #3: countPendientes() ya existía en el repositorio.
        // Se agrega al response para que el frontend tenga el valor exacto
        // sin necesidad de estimarlo a partir de totalElements.
        long totalPendientes = planillaRepository.countPendientes();

        Map<String, Object> response = Map.of(
                "content",          content,
                "totalElements",    resultado.getTotalElements(),
                "totalPages",       resultado.getTotalPages(),
                "currentPage",      resultado.getNumber(),
                "pageSize",         resultado.getSize(),
                "totalPendientes",  totalPendientes);   // ← campo nuevo

        return ResponseEntity.ok(response);
    }

    @GetMapping("/planillas/pendientes/count")
    public ResponseEntity<Long> countPendientes() {
        return ResponseEntity.ok(planillaRepository.countPendientes());
    }
}