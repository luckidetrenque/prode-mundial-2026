package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.EstadisticaPartidoDTO;
import com.prode.mundial_2026.model.Partido;
import com.prode.mundial_2026.model.Prediccion;
import com.prode.mundial_2026.repository.PartidoRepository;
import com.prode.mundial_2026.repository.PrediccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class EstadisticaService {

    private final PrediccionRepository prediccionRepository;
    private final PartidoRepository partidoRepository;

    public List<EstadisticaPartidoDTO> obtenerEstadisticas() {
        // 1. Obtener todos los partidos para tener sus nombres
        List<Partido> partidos = partidoRepository.findAllWithEquipos();

        // 2. Obtener conteo de votos de la DB
        List<Object[]> rawStats = prediccionRepository.countVotesByPartidoAndResultado();

        // Mapa para organizar: partidoId -> { LOCAL -> count, EMPATE -> count,
        // VISITANTE -> count }
        Map<Long, Map<Prediccion.ResultadoPrediccion, Long>> statsMap = new HashMap<>();

        for (Object[] row : rawStats) {
            Long partidoId = (Long) row[0];
            Prediccion.ResultadoPrediccion resultado = (Prediccion.ResultadoPrediccion) row[1];
            Long count = (Long) row[2];

            statsMap.computeIfAbsent(partidoId, k -> new HashMap<>()).put(resultado, count);
        }

        // 3. Mapear a DTOs
        return partidos.stream().map(p -> {
            Map<Prediccion.ResultadoPrediccion, Long> matchVotes = statsMap.getOrDefault(p.getId(),
                    Collections.emptyMap());

            long local = matchVotes.getOrDefault(Prediccion.ResultadoPrediccion.LOCAL, 0L);
            long empate = matchVotes.getOrDefault(Prediccion.ResultadoPrediccion.EMPATE, 0L);
            long visitante = matchVotes.getOrDefault(Prediccion.ResultadoPrediccion.VISITANTE, 0L);
            long total = local + empate + visitante;

            return new EstadisticaPartidoDTO(
                    p.getNumero(),
                    p.getEquipoLocal() != null ? p.getEquipoLocal().getNombreShow() : "TBD",
                    p.getEquipoVisitante() != null ? p.getEquipoVisitante().getNombreShow() : "TBD",
                    p.getGrupo(),
                    local,
                    empate,
                    visitante,
                    total);
        }).toList();
    }
}
