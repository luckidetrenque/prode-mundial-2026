package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.ResultadoDTO;
import com.prode.mundial_2026.dto.ResultadoRequestDTO;
import com.prode.mundial_2026.model.Partido;
import com.prode.mundial_2026.model.Prediccion;
import com.prode.mundial_2026.model.Resultado;
import com.prode.mundial_2026.repository.PartidoRepository;
import com.prode.mundial_2026.repository.ResultadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultadoService {

    private final ResultadoRepository resultadoRepository;
    private final PartidoRepository partidoRepository;
    private final TablaPosicionesService tablaPosicionesService;

    @Transactional
    public ResultadoDTO guardarResultadoOficial(Long partidoId, ResultadoRequestDTO dto) {
        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado: " + partidoId));

        Optional<Resultado> resultadoExistenteOpt = resultadoRepository.findByPartidoId(partidoId);

        // CORRECCIÓN DE ERRORES: Si ya existía un resultado, restamos su impacto antes
        // de guardar el nuevo
        if (resultadoExistenteOpt.isPresent()) {
            Resultado resViejo = resultadoExistenteOpt.get();
            tablaPosicionesService.revertirImpactoResultado(partido, resViejo.getGolesLocal(),
                    resViejo.getGolesVisitante());
        }

        Resultado resultado = resultadoExistenteOpt.orElse(new Resultado());

        resultado.setPartido(partido);
        resultado.setResultado(Prediccion.ResultadoPrediccion.valueOf(dto.getResultado()));
        resultado.setGolesLocal(dto.getGolesLocal());
        resultado.setGolesVisitante(dto.getGolesVisitante());

        Resultado guardado = resultadoRepository.save(resultado);

        // NUEVA CARGA: Sumamos el impacto del resultado final/corregido
        tablaPosicionesService.aplicarImpactoResultado(partido, guardado.getGolesLocal(), guardado.getGolesVisitante());

        return mapearADto(guardado, partido);
    }

    @Transactional
    public void eliminar(Long partidoId) {
        resultadoRepository.findByPartidoId(partidoId).ifPresent(resultado -> {
            // Antes de borrar físicamente el resultado, restamos su impacto de las tablas
            tablaPosicionesService.revertirImpactoResultado(resultado.getPartido(), resultado.getGolesLocal(),
                    resultado.getGolesVisitante());
            resultadoRepository.delete(resultado);
        });
    }

    @Transactional
    public int resetearPorGrupo(String grupo) {
        List<Partido> partidos = partidoRepository.findByGrupo(grupo);
        int eliminados = 0;

        for (Partido p : partidos) {
            Optional<Resultado> rOpt = resultadoRepository.findByPartidoId(p.getId());
            if (rOpt.isPresent()) {
                Resultado r = rOpt.get();
                // Revertimos de a uno el impacto del grupo
                tablaPosicionesService.revertirImpactoResultado(p, r.getGolesLocal(), r.getGolesVisitante());
                resultadoRepository.delete(r);
                eliminados++;
            }
        }
        return eliminados;
    }

    @Transactional
    public int resetearTodos() {
        // En un enfoque puramente incremental, para vaciar todo limpiamos los
        // resultados uno a uno
        // o ejecutamos un truncado directo sobre posiciones_equipos si se quiere volver
        // a cero absoluto.
        List<Resultado> todos = resultadoRepository.findAll();
        int eliminados = todos.size();

        for (Resultado r : todos) {
            tablaPosicionesService.revertirImpactoResultado(r.getPartido(), r.getGolesLocal(), r.getGolesVisitante());
        }
        resultadoRepository.deleteAll();
        return eliminados;
    }

    // ── MÉTODO PRIVADO PARA MAPEAR TU DTO ──────────────────────────
    private ResultadoDTO mapearADto(Resultado resultado, Partido partido) {

        // 1. Armamos el resumen anidado del partido que exige tu DTO
        ResultadoDTO.PartidoResumenDTO partidoResumen = new ResultadoDTO.PartidoResumenDTO(
                partido.getId(),
                partido.getNumero() // Asumiendo que Partido tiene "numero"
        );

        // 2. Calculamos el string del ganador
        String textoResultado = "EMPATE";
        if (resultado.getGolesLocal() > resultado.getGolesVisitante()) {
            textoResultado = "LOCAL";
        } else if (resultado.getGolesLocal() < resultado.getGolesVisitante()) {
            textoResultado = "VISITANTE";
        }

        // 3. Devolvemos la instancia completa
        return new ResultadoDTO(
                partidoResumen,
                textoResultado,
                resultado.getGolesLocal(),
                resultado.getGolesVisitante());
    }
}