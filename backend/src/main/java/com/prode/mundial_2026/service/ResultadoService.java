package com.prode.mundial_2026.service;

import com.prode.mundial_2026.model.Partido;
import com.prode.mundial_2026.repository.PartidoRepository;
import com.prode.mundial_2026.repository.ResultadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultadoService {

    private final ResultadoRepository resultadoRepository;
    private final PartidoRepository partidoRepository;
    // private final PosicionService posicionService; // Omitted, it calculates on the fly

    @Transactional
    public int resetearPorGrupo(String grupo) {
        List<Partido> partidos = partidoRepository.findByGrupo(grupo);
        List<Long> partidoIds = partidos.stream()
                .map(Partido::getId)
                .collect(Collectors.toList());

        if (partidoIds.isEmpty()) {
            return 0;
        }

        int eliminados = resultadoRepository.deleteByPartidoIdIn(partidoIds);
        
        // No cache to clear for positions, recalculates on the fly when requested
        return eliminados;
    }

    @Transactional
    public int resetearTodos() {
        return resultadoRepository.deleteAllBulk();
    }

    @Transactional
    public void eliminar(Long partidoId) {
        resultadoRepository.findByPartidoId(partidoId).ifPresent(resultadoRepository::delete);
    }
}
