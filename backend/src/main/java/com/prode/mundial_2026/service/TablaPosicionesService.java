package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.GrupoPosicionesDTO;
import com.prode.mundial_2026.dto.FilaPosicionDTO;
import com.prode.mundial_2026.model.Partido;
import com.prode.mundial_2026.model.PosicionEquipo;
import com.prode.mundial_2026.model.Resultado;
import com.prode.mundial_2026.repository.PartidoRepository;
import com.prode.mundial_2026.repository.PosicionEquipoRepository;
import com.prode.mundial_2026.repository.ResultadoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TablaPosicionesService {

    private final PosicionEquipoRepository posicionRepository;
    private final PartidoRepository partidoRepository;
    private final ResultadoRepository resultadoRepository;

    public TablaPosicionesService(PosicionEquipoRepository posicionRepository,
            PartidoRepository partidoRepository,
            ResultadoRepository resultadoRepository) {
        this.posicionRepository = posicionRepository;
        this.partidoRepository = partidoRepository;
        this.resultadoRepository = resultadoRepository;
    }

    @Transactional
    public void aplicarImpactoResultado(Partido partido, int golesLocal, int golesVisitante) {
        String nombreLocal = partido.getEquipoLocal().getNombreShow();
        String nombreVisitante = partido.getEquipoVisitante().getNombreShow();

        // Upsert: Si el equipo no tiene fila en la tabla de posiciones, se crea una
        // inicializada en 0
        PosicionEquipo local = posicionRepository.findByNombreEquipo(nombreLocal)
                .orElse(new PosicionEquipo(partido.getGrupo(), nombreLocal, partido.getEquipoLocal().getBanderaUrl()));
        PosicionEquipo visitante = posicionRepository.findByNombreEquipo(nombreVisitante)
                .orElse(new PosicionEquipo(partido.getGrupo(), nombreVisitante,
                        partido.getEquipoVisitante().getBanderaUrl()));

        // Sumar estadísticas básicas
        local.setPartidosJugados(local.getPartidosJugados() + 1);
        visitante.setPartidosJugados(visitante.getPartidosJugados() + 1);

        local.setGolesFavor(local.getGolesFavor() + golesLocal);
        local.setGolesContra(local.getGolesContra() + golesVisitante);
        visitante.setGolesFavor(visitante.getGolesFavor() + golesVisitante);
        visitante.setGolesContra(visitante.getGolesContra() + golesLocal);

        // Evaluar resultado para asignar puntos y tendencias
        if (golesLocal > golesVisitante) {
            local.setPuntos(local.getPuntos() + 3);
            local.setPartidosGanados(local.getPartidosGanados() + 1);
            visitante.setPartidosPerdidos(visitante.getPartidosPerdidos() + 1);
        } else if (golesLocal < golesVisitante) {
            visitante.setPuntos(visitante.getPuntos() + 3);
            visitante.setPartidosGanados(visitante.getPartidosGanados() + 1);
            local.setPartidosPerdidos(local.getPartidosPerdidos() + 1);
        } else {
            local.setPuntos(local.getPuntos() + 1);
            visitante.setPuntos(visitante.getPuntos() + 1);
            local.setPartidosEmpatados(local.getPartidosEmpatados() + 1);
            visitante.setPartidosEmpatados(visitante.getPartidosEmpatados() + 1);
        }

        local.setDiferenciaGoles(local.getGolesFavor() - local.getGolesContra());
        visitante.setDiferenciaGoles(visitante.getGolesFavor() - visitante.getGolesContra());

        posicionRepository.save(local);
        posicionRepository.save(visitante);
    }

    @Transactional
    public void revertirImpactoResultado(Partido partido, int golesLocalAnterior, int golesVisitanteAnterior) {
        String nombreLocal = partido.getEquipoLocal().getNombreShow();
        String nombreVisitante = partido.getEquipoVisitante().getNombreShow();

        PosicionEquipo local = posicionRepository.findByNombreEquipo(nombreLocal).orElse(null);
        PosicionEquipo visitante = posicionRepository.findByNombreEquipo(nombreVisitante).orElse(null);

        // Si por alguna anomalía no existen, prevenimos un NullPointerException
        if (local == null || visitante == null)
            return;

        // Restar el partido que se había computado
        local.setPartidosJugados(local.getPartidosJugados() - 1);
        visitante.setPartidosJugados(visitante.getPartidosJugados() - 1);

        // Restar los goles de la carga errónea
        local.setGolesFavor(local.getGolesFavor() - golesLocalAnterior);
        local.setGolesContra(local.getGolesContra() - golesVisitanteAnterior);
        visitante.setGolesFavor(visitante.getGolesFavor() - golesVisitanteAnterior);
        visitante.setGolesContra(visitante.getGolesContra() - golesLocalAnterior);

        // Restar los puntos y tendencias de la carga errónea
        if (golesLocalAnterior > golesVisitanteAnterior) {
            local.setPuntos(local.getPuntos() - 3);
            local.setPartidosGanados(local.getPartidosGanados() - 1);
            visitante.setPartidosPerdidos(visitante.getPartidosPerdidos() - 1);
        } else if (golesLocalAnterior < golesVisitanteAnterior) {
            visitante.setPuntos(visitante.getPuntos() - 3);
            visitante.setPartidosGanados(visitante.getPartidosGanados() - 1);
            local.setPartidosPerdidos(local.getPartidosPerdidos() - 1);
        } else {
            local.setPuntos(local.getPuntos() - 1);
            visitante.setPuntos(visitante.getPuntos() - 1);
            local.setPartidosEmpatados(local.getPartidosEmpatados() - 1);
            visitante.setPartidosEmpatados(visitante.getPartidosEmpatados() - 1);
        }

        local.setDiferenciaGoles(local.getGolesFavor() - local.getGolesContra());
        visitante.setDiferenciaGoles(visitante.getGolesFavor() - visitante.getGolesContra());

        posicionRepository.save(local);
        posicionRepository.save(visitante);
    }

    // Consulta ultrarrápida: Estructura y agrupa directamente para solucionar el
    // render del Frontend
    public List<GrupoPosicionesDTO> obtenerTablaAgrupada() {
        List<PosicionEquipo> todas = posicionRepository
                .findAllByOrderByGrupoAscPuntosDescDiferenciaGolesDescGolesFavorDesc();

        Map<String, List<PosicionEquipo>> agrupadas = todas.stream()
                .collect(Collectors.groupingBy(PosicionEquipo::getGrupo, LinkedHashMap::new, Collectors.toList()));

        List<GrupoPosicionesDTO> respuesta = new ArrayList<>();
        for (Map.Entry<String, List<PosicionEquipo>> entry : agrupadas.entrySet()) {
            GrupoPosicionesDTO grupoDTO = new GrupoPosicionesDTO();
            grupoDTO.setNombreGrupo(entry.getKey());

            List<FilaPosicionDTO> filas = entry.getValue().stream().map(p -> {
                FilaPosicionDTO f = new FilaPosicionDTO();
                f.setNombreEquipo(p.getNombreEquipo());
                f.setBanderaUrl(p.getBanderaUrl());
                f.setPuntos(p.getPuntos());
                f.setPartidosJugados(p.getPartidosJugados());
                f.setPartidosGanados(p.getPartidosGanados());
                f.setPartidosEmpatados(p.getPartidosEmpatados());
                f.setPartidosPerdidos(p.getPartidosPerdidos());
                f.setGolesFavor(p.getGolesFavor());
                f.setGolesContra(p.getGolesContra());
                f.setDiferenciaGoles(p.getDiferenciaGoles());
                return f;
            }).collect(Collectors.toList());

            grupoDTO.setEquipos(filas);
            respuesta.add(grupoDTO);
        }
        return respuesta;
    }
}