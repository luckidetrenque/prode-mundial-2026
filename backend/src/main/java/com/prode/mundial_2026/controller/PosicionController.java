package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.PosicionDTO;
import com.prode.mundial_2026.service.PosicionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Sin cambios en la interfaz HTTP — el fix es interno al service/repository.
// El endpoint sigue siendo GET /api/posiciones y devuelve List<PosicionDTO>.
@RestController
@RequestMapping("/api/posiciones")
@RequiredArgsConstructor
public class PosicionController {

    private final PosicionService posicionService;

    @GetMapping
    public ResponseEntity<List<PosicionDTO>> obtenerPosiciones() {
        return ResponseEntity.ok(posicionService.calcularPosiciones());
    }
}