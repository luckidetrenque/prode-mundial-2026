package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.PartidoDTO;
import com.prode.mundial_2026.model.Partido;
import com.prode.mundial_2026.repository.PartidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partidos")
@RequiredArgsConstructor
public class PartidoController {

    private final PartidoRepository partidoRepository;

    // GET /api/partidos → devuelve los 104 partidos
    @GetMapping
    public ResponseEntity<List<PartidoDTO>> listarTodos() {
        List<PartidoDTO> partidos = partidoRepository.findAllWithEquipos()
                .stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(partidos);
    }

    // GET /api/partidos/{id}
    // @PathVariable → extrae el {id} de la URL
    @GetMapping("/{id}")
    public ResponseEntity<PartidoDTO> obtenerPorId(@PathVariable Long id) {
        return partidoRepository.findById(id)
                .map(p -> ResponseEntity.ok(toDTO(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Convierte la entidad Partido al DTO que recibe Angular
    private PartidoDTO toDTO(Partido p) {
        PartidoDTO dto = new PartidoDTO();
        dto.setId(p.getId());
        dto.setNumero(p.getNumero());
        if (p.getEquipoLocal() != null) {
            dto.setEquipoLocalNombre(p.getEquipoLocal().getNombre());
            dto.setEquipoLocalShow(p.getEquipoLocal().getNombreShow());
            dto.setEquipoLocalBandera(p.getEquipoLocal().getBanderaUrl());
        }
        if (p.getEquipoVisitante() != null) {
            dto.setEquipoVisitanteNombre(p.getEquipoVisitante().getNombre());
            dto.setEquipoVisitanteShow(p.getEquipoVisitante().getNombreShow());
            dto.setEquipoVisitanteBandera(p.getEquipoVisitante().getBanderaUrl());
        }
        dto.setFase(p.getFase().name());
        dto.setGrupo(p.getGrupo());
        dto.setJornada(p.getJornada());
        dto.setFechaHora(p.getFechaHora());
        dto.setSede(p.getSede());
        return dto;
    }
}