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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultadoService {

    private final ResultadoRepository resultadoRepository;
    private final PartidoRepository partidoRepository;
    private final TablaPosicionesService tablaPosicionesService;

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

        // Si borramos resultados, actualizamos la tabla de posiciones a su nuevo estado
        tablaPosicionesService.generarYActualizarTablas();

        return eliminados;
    }

    @Transactional
    public int resetearTodos() {
        int eliminados = resultadoRepository.deleteAllBulk();

        // Actualizamos la tabla de posiciones para que vuelva a cero
        tablaPosicionesService.generarYActualizarTablas();

        return eliminados;
    }

    @Transactional
    public void eliminar(Long partidoId) {
        resultadoRepository.findByPartidoId(partidoId).ifPresent(resultado -> {
            resultadoRepository.delete(resultado);
            // Actualizamos posiciones al borrar un resultado puntual
            tablaPosicionesService.generarYActualizarTablas();
        });
    }

    @Transactional
    public ResultadoDTO guardarResultadoOficial(Long partidoId, ResultadoRequestDTO dto) {

        Partido partido = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado: " + partidoId));

        Resultado resultado = resultadoRepository.findByPartidoId(partidoId)
                .orElse(new Resultado());

        // 1. Seteamos los valores SOLO en la entidad Resultado
        resultado.setPartido(partido);
        resultado.setResultado(Prediccion.ResultadoPrediccion.valueOf(dto.getResultado()));
        resultado.setGolesLocal(dto.getGolesLocal());
        resultado.setGolesVisitante(dto.getGolesVisitante());

        // 2. Guardamos físicamente el resultado
        Resultado guardado = resultadoRepository.save(resultado);

        // 3. [GATILLO CLAVE]: Recalculamos las posiciones físicas en la tabla
        // PosicionEquipo
        tablaPosicionesService.generarYActualizarTablas();

        // 4. Mapeamos al DTO de salida
        return mapearADto(guardado, partido);
        /*
         * return new ResultadoDTO(
         * new ResultadoDTO.PartidoResumenDTO(
         * guardado.getPartido().getId(),
         * guardado.getPartido().getNumero()),
         * guardado.getResultado().name(),
         * guardado.getGolesLocal(),
         * guardado.getGolesVisitante());
         */
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