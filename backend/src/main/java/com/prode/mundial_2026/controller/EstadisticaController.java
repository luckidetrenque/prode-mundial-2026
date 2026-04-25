package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.EstadisticaPartidoDTO;
import com.prode.mundial_2026.service.EstadisticaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estadisticas")
@RequiredArgsConstructor
public class EstadisticaController {

    private final EstadisticaService estadisticaService;

    @GetMapping
    public ResponseEntity<List<EstadisticaPartidoDTO>> obtenerEstadisticas() {
        return ResponseEntity.ok(estadisticaService.obtenerEstadisticas());
    }
}
