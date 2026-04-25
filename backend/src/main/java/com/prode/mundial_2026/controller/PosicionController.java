package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.PosicionDTO;
import com.prode.mundial_2026.service.PosicionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posiciones")
@RequiredArgsConstructor
public class PosicionController {

    private final PosicionService posicionService;

    // GET /api/posiciones → devuelve la tabla de posiciones calculada
    @GetMapping
    public ResponseEntity<List<PosicionDTO>> obtenerPosiciones() {
        return ResponseEntity.ok(posicionService.calcularPosiciones());
    }
}