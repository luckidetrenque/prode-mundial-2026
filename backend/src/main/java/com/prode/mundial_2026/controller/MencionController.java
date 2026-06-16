// backend/src/main/java/com/prode/mundial_2026/controller/MencionController.java
package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.MencionesResponseDTO;
import com.prode.mundial_2026.service.MencionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posiciones")
@RequiredArgsConstructor
public class MencionController {

    private final MencionService mencionService;

    @GetMapping("/menciones")
    public ResponseEntity<MencionesResponseDTO> getMenciones() {
        return ResponseEntity.ok(mencionService.getMenciones());
    }
}