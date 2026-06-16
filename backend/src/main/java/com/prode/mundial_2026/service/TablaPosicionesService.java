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
    public void generarYActualizarTablas() {
        // 1. Limpiamos por completo el estado viejo de la tabla física
        posicionRepository.deleteAll();

        // 2. Traemos todos los partidos estructurados de la fase de grupos
        List<Partido> partidos = partidoRepository.findAll().stream()
                .filter(p -> p.getFase() != null && "GRUPOS".equalsIgnoreCase(p.getFase().name()))
                .collect(Collectors.toList());

        Map<String, PosicionEquipo> mapaPosiciones = new HashMap<>();

        for (Partido p : partidos) {
            String grupo = (p.getGrupo() != null) ? p.getGrupo() : "Sin Grupo";

            // Accedemos al nombre usando .getNombre() (ajustá esto si el getter en Equipo
            // se llama distinto)
            String nombreLocal = p.getEquipoLocal().getNombreShow();
            String nombreVisitante = p.getEquipoVisitante().getNombreShow();
            String banderaLocal = p.getEquipoLocal().getBanderaUrl();
            String banderaVisitante = p.getEquipoVisitante().getBanderaUrl();

            // Ahora usamos los nombres (Strings) como llaves y para el constructor
            mapaPosiciones.putIfAbsent(nombreLocal, new PosicionEquipo(grupo, nombreLocal, banderaLocal));
            mapaPosiciones.putIfAbsent(nombreVisitante, new PosicionEquipo(grupo, nombreVisitante, banderaVisitante));

            Optional<Resultado> resultadoOpt = resultadoRepository.findByPartidoId(p.getId());

            if (resultadoOpt.isPresent()) {
                Resultado res = resultadoOpt.get();
                PosicionEquipo el = mapaPosiciones.get(nombreLocal);
                PosicionEquipo ev = mapaPosiciones.get(nombreVisitante);

                el.setPartidosJugados(el.getPartidosJugados() + 1);
                ev.setPartidosJugados(ev.getPartidosJugados() + 1);

                int gl = res.getGolesLocal();
                int gv = res.getGolesVisitante();

                el.setGolesFavor(el.getGolesFavor() + gl);
                el.setGolesContra(el.getGolesContra() + gv);
                ev.setGolesFavor(ev.getGolesFavor() + gv);
                ev.setGolesContra(ev.getGolesContra() + gl);

                if (gl > gv) {
                    el.setPuntos(el.getPuntos() + 3);
                    el.setPartidosGanados(el.getPartidosGanados() + 1);
                    ev.setPartidosPerdidos(ev.getPartidosPerdidos() + 1);
                } else if (gl < gv) {
                    ev.setPuntos(ev.getPuntos() + 3);
                    ev.setPartidosGanados(ev.getPartidosGanados() + 1);
                    el.setPartidosPerdidos(el.getPartidosPerdidos() + 1);
                } else {
                    el.setPuntos(el.getPuntos() + 1);
                    ev.setPuntos(ev.getPuntos() + 1);
                    el.setPartidosEmpatados(el.getPartidosEmpatados() + 1);
                    ev.setPartidosEmpatados(ev.getPartidosEmpatados() + 1);
                }

                el.setDiferenciaGoles(el.getGolesFavor() - el.getGolesContra());
                ev.setDiferenciaGoles(ev.getGolesFavor() - ev.getGolesContra());
            }
        }

        // 3. Guardamos el nuevo estado definitivo procesado directo en la base de datos
        posicionRepository.saveAll(mapaPosiciones.values());
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