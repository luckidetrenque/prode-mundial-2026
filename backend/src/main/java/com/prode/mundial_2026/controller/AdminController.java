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
     * FIX #13: El endpoint anterior cargaba TODAS las planillas en memoria
     * con un único findAllWithUsuario() sin paginación.
     * Con miles de planillas esto puede generar OOM o respuestas lentas.
     *
     * Ahora acepta parámetros opcionales de paginación:
     * GET /api/admin/planillas?page=0&size=50
     *
     * El frontend (confirmar-planillas) debe actualizarse para consumir
     * la estructura paginada { content: [], totalElements, totalPages, ... }.
     *
     * Valor por defecto: página 0, tamaño 100 (retrocompatible para la UI actual).
     */
    @GetMapping("/planillas")
    public ResponseEntity<Map<String, Object>> listarTodasLasPlanillas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        // Limitar el tamaño máximo por request para evitar abusos
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 500);

        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<com.prode.mundial_2026.model.Planilla> resultado = planillaRepository.findAllWithUsuarioPaged(pageable);

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

        // Respuesta con metadata de paginación
        Map<String, Object> response = Map.of(
                "content", content,
                "totalElements", resultado.getTotalElements(),
                "totalPages", resultado.getTotalPages(),
                "currentPage", resultado.getNumber(),
                "pageSize", resultado.getSize());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/planillas/pendientes/count")
    public ResponseEntity<Long> countPendientes() {
        return ResponseEntity.ok(planillaRepository.countPendientes());
    }
}