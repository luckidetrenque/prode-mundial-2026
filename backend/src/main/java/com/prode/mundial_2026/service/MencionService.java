// backend/src/main/java/com/prode/mundial_2026/service/MencionService.java
package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.MencionDTO;
import com.prode.mundial_2026.dto.MencionDTO.ParticipanteResumenDTO;
import com.prode.mundial_2026.dto.MencionesResponseDTO;
import com.prode.mundial_2026.repository.MencionRepository;
import com.prode.mundial_2026.repository.ResultadoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MencionService {

    private final MencionRepository mencionRepository;
    private final ResultadoRepository resultadoRepository;

    // Caché en memoria — se actualiza cada 30 min por el scheduler
    private MencionesResponseDTO cache = null;

    // ── Punto de entrada público ──────────────────────────────────────────

    public MencionesResponseDTO getMenciones() {
        if (cache == null) {
            calcularYCachear();
        }
        return cache;
    }

    // ── Scheduler ─────────────────────────────────────────────────────────

    @Scheduled(fixedRate = 30 * 60 * 1000)
    @Transactional(readOnly = true)
    public void calcularYCachear() {
        log.info("[MENCIONES] Iniciando cálculo de menciones...");
        try {
            int totalResultados = resultadoRepository.findAll().size();
            if (totalResultados == 0) {
                cache = new MencionesResponseDTO(List.of(), LocalDateTime.now(), false);
                log.info("[MENCIONES] Sin resultados cargados, caché vacío.");
                return;
            }

            List<MencionDTO> menciones = new ArrayList<>();

            calcularAdivinos(menciones);
            calcularDiamante(menciones);
            calcularPuntero(menciones);
            calcularMasX2(menciones);
            calcularMasEmpatador(menciones);
            calcularConsenso(menciones);
            calcularResistente(menciones);
            calcularRemontadaYBajon(menciones);
            calcularContraLaCorriente(menciones);
            calcularRachaEnLlamas(menciones);
            calcularElTapado(menciones);
            calcularEspecialistaX2(menciones);
            calcularElArranque(menciones);
            calcularDiaPerfecto(menciones);

            cache = new MencionesResponseDTO(menciones, LocalDateTime.now(), true);
            log.info("[MENCIONES] Cálculo finalizado. {} menciones generadas.", menciones.size());
        } catch (Exception e) {
            log.error("[MENCIONES] Error al calcular menciones: {}", e.getMessage());
        }
    }

    // ── Menciones individuales ────────────────────────────────────────────

    private void calcularAdivinos(List<MencionDTO> menciones) {
        // Paso 1: partidos con exactamente 1 acertador (query liviana, sin subquery)
        List<Object[]> solos = mencionRepository.findPartidosConExactamenteUnAcierto();
        if (solos.isEmpty())
            return;

        List<Long> partidoIds = solos.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        // Paso 2: traer datos de esos partidos y sus acertadores
        List<Object[]> rows = mencionRepository.findAcertadoresPorPartidos(partidoIds);

        for (Object[] row : rows) {
            int numero = ((Number) row[1]).intValue();
            String local = (String) row[2];
            String visitante = (String) row[3];
            String nombre = (String) row[4];
            String apellido = (String) row[5];
            Long codigo = ((Number) row[6]).longValue();

            menciones.add(new MencionDTO(
                    "EL_ADIVINO",
                    "🎯",
                    "El Adivino",
                    "Único que acertó el partido #" + numero
                            + " (" + local + " vs " + visitante + ")",
                    List.of(new ParticipanteResumenDTO(nombre, apellido, codigo))));
        }
    }

    private void calcularDiamante(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findAcertadoresDiamante();
        if (rows.isEmpty())
            return;

        int numero = ((Number) rows.get(0)[1]).intValue();
        String local = (String) rows.get(0)[2];
        String visitante = (String) rows.get(0)[3];

        List<ParticipanteResumenDTO> participantes = rows.stream()
                .map(r -> new ParticipanteResumenDTO(
                        (String) r[4],
                        (String) r[5],
                        ((Number) r[6]).longValue()))
                .toList();

        menciones.add(new MencionDTO(
                "DIAMANTE",
                "💎",
                "Diamante en bruto",
                "Acertó el partido más difícil del torneo: #" + numero
                        + " (" + local + " vs " + visitante + ")",
                participantes));
    }

    private void calcularDiaPerfecto(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findDiaPerfecto();
        if (rows.isEmpty())
            return;

        // Agrupar por fecha
        Map<String, List<ParticipanteResumenDTO>> porFecha = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String fecha = row[0].toString(); // "2026-06-11"
            String nombre = (String) row[1];
            String apellido = (String) row[2];
            Long codigo = ((Number) row[3]).longValue();

            porFecha.computeIfAbsent(fecha, k -> new ArrayList<>())
                    .add(new ParticipanteResumenDTO(nombre, apellido, codigo));
        }

        porFecha.forEach((fecha, participantes) -> {
            // Formatear fecha: "2026-06-11" → "11/06"
            String[] partes = fecha.split("-");
            String fechaShow = partes[2] + "/" + partes[1];

            menciones.add(new MencionDTO(
                    "DIA_PERFECTO",
                    "🔥",
                    "Día perfecto",
                    "Acertó todos los partidos del " + fechaShow,
                    participantes));
        });
    }

    private void calcularPuntero(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findPuntajeGeneral();
        if (rows.isEmpty())
            return;

        long maxPuntos = ((Number) rows.get(0)[3]).longValue();
        List<ParticipanteResumenDTO> lideres = rows.stream()
                .filter(r -> ((Number) r[3]).longValue() == maxPuntos)
                .map(r -> new ParticipanteResumenDTO(
                        (String) r[0], (String) r[1], ((Number) r[2]).longValue()))
                .toList();

        menciones.add(new MencionDTO(
                "PUNTERO",
                "👑",
                "El Puntero",
                "Lidera la tabla con " + maxPuntos + " punto" + (maxPuntos != 1 ? "s" : ""),
                lideres));
    }

    private void calcularMasX2(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findMasX2();
        if (rows.isEmpty())
            return;

        long puntosX2 = ((Number) rows.get(0)[3]).longValue();
        menciones.add(new MencionDTO(
                "MAS_X2",
                "⚡",
                "El más X2",
                "Sacó más partido a los bonus: " + puntosX2 + " punto" + (puntosX2 != 1 ? "s" : "")
                        + " en partidos dobles",
                List.of(new ParticipanteResumenDTO(
                        (String) rows.get(0)[0],
                        (String) rows.get(0)[1],
                        ((Number) rows.get(0)[2]).longValue()))));
    }

    private void calcularMasEmpatador(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findMasEmpatador();
        if (rows.isEmpty())
            return;

        long cantidad = ((Number) rows.get(0)[3]).longValue();
        if (cantidad == 0)
            return;

        menciones.add(new MencionDTO(
                "EMPATADOR",
                "🤝",
                "El Equilibrista",
                "Acertó más empates que nadie: " + cantidad + " empate" + (cantidad != 1 ? "s" : ""),
                List.of(new ParticipanteResumenDTO(
                        (String) rows.get(0)[0],
                        (String) rows.get(0)[1],
                        ((Number) rows.get(0)[2]).longValue()))));
    }

    private void calcularConsenso(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findMasConsenso();
        if (rows.isEmpty())
            return;

        long veces = ((Number) rows.get(0)[3]).longValue();
        menciones.add(new MencionDTO(
                "CONSENSO",
                "🗳️",
                "El Consenso",
                "Votó igual que la mayoría en " + veces + " partido" + (veces != 1 ? "s" : ""),
                List.of(new ParticipanteResumenDTO(
                        (String) rows.get(0)[0],
                        (String) rows.get(0)[1],
                        ((Number) rows.get(0)[2]).longValue()))));
    }

    private void calcularResistente(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findPuntajeGeneral();
        if (rows.size() < 2)
            return;

        // El último de la tabla
        Object[] ultimo = rows.get(rows.size() - 1);
        menciones.add(new MencionDTO(
                "RESISTENTE",
                "🐢",
                "El Resistente",
                "Último en la tabla pero sin rendirse",
                List.of(new ParticipanteResumenDTO(
                        (String) ultimo[0],
                        (String) ultimo[1],
                        ((Number) ultimo[2]).longValue()))));
    }

    private void calcularRemontadaYBajon(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findPuntajePorDia();
        if (rows.isEmpty())
            return;

        // Agrupar: Map<codigoPlanilla, Map<fecha, puntosEnEseDia>>
        Map<Long, Map<String, Long>> puntajesPorPlanilla = new LinkedHashMap<>();
        Map<Long, ParticipanteResumenDTO> infoParticipante = new HashMap<>();

        for (Object[] row : rows) {
            String fecha = row[0].toString(); // "2026-06-11"
            String nombre = (String) row[1];
            String apellido = (String) row[2];
            Long codigo = ((Number) row[3]).longValue();
            long puntos = ((Number) row[4]).longValue();

            puntajesPorPlanilla
                    .computeIfAbsent(codigo, k -> new TreeMap<>()) // TreeMap → orden cronológico
                    .put(fecha, puntos);
            infoParticipante.putIfAbsent(codigo,
                    new ParticipanteResumenDTO(nombre, apellido, codigo));
        }

        // Obtener lista de fechas ordenadas
        List<String> fechasOrdenadas = rows.stream()
                .map(r -> r[0].toString())
                .distinct()
                .sorted()
                .toList();

        if (fechasOrdenadas.size() < 2)
            return; // Necesitamos al menos 2 días

        String diaActual = fechasOrdenadas.get(fechasOrdenadas.size() - 1);
        String diaAnterior = fechasOrdenadas.get(fechasOrdenadas.size() - 2);

        // Puntos acumulados hasta el día anterior y hasta el día actual
        Map<Long, Long> puntosHastaAnterior = calcularPuntosAcumuladosHasta(puntajesPorPlanilla, diaAnterior);
        Map<Long, Long> puntosHastaActual = calcularPuntosAcumuladosHasta(puntajesPorPlanilla, diaActual);

        // Ranking en cada momento
        Map<Long, Integer> posAnterior = calcularRanking(puntosHastaAnterior);
        Map<Long, Integer> posActual = calcularRanking(puntosHastaActual);

        Long mejorCodigo = null;
        int mejorSalto = 0;
        Long peorCodigo = null;
        int peorCaida = 0;

        for (Long codigo : posActual.keySet()) {
            if (!posAnterior.containsKey(codigo))
                continue;
            // positivo = subió puestos, negativo = bajó
            int diff = posAnterior.get(codigo) - posActual.get(codigo);
            if (diff > mejorSalto) {
                mejorSalto = diff;
                mejorCodigo = codigo;
            }
            if (diff < peorCaida) {
                peorCaida = diff;
                peorCodigo = codigo;
            }
        }

        // Formatear fecha para mostrar: "2026-06-12" → "12/06"
        String[] partes = diaActual.split("-");
        String fechaShow = partes[2] + "/" + partes[1];

        if (mejorCodigo != null && mejorSalto > 0) {
            menciones.add(new MencionDTO(
                    "REMONTADA",
                    "📈",
                    "La Remontada",
                    "Subió " + mejorSalto + " puesto" + (mejorSalto != 1 ? "s" : "")
                            + " el " + fechaShow,
                    List.of(infoParticipante.get(mejorCodigo))));
        }

        if (peorCodigo != null && peorCaida < 0) {
            menciones.add(new MencionDTO(
                    "BAJON",
                    "📉",
                    "El Bajón",
                    "Cayó " + Math.abs(peorCaida) + " puesto" + (Math.abs(peorCaida) != 1 ? "s" : "")
                            + " el " + fechaShow,
                    List.of(infoParticipante.get(peorCodigo))));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Map<Long, Long> calcularPuntosAcumuladosHasta(
            Map<Long, Map<String, Long>> puntajesPorPlanilla, String hastaFecha) {
        Map<Long, Long> resultado = new HashMap<>();
        puntajesPorPlanilla.forEach((codigo, fechaMap) -> {
            long total = fechaMap.entrySet().stream()
                    .filter(e -> e.getKey().compareTo(hastaFecha) <= 0) // comparación lexicográfica — funciona con ISO
                                                                        // dates
                    .mapToLong(Map.Entry::getValue)
                    .sum();
            resultado.put(codigo, total);
        });
        return resultado;
    }

    private Map<Long, Integer> calcularRanking(Map<Long, Long> puntosPorCodigo) {
        List<Map.Entry<Long, Long>> sorted = puntosPorCodigo.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .toList();

        Map<Long, Integer> ranking = new HashMap<>();
        int pos = 1;
        long lastPts = -1;

        for (int i = 0; i < sorted.size(); i++) {
            if (sorted.get(i).getValue() != lastPts) {
                pos = i + 1;
                lastPts = sorted.get(i).getValue();
            }
            ranking.put(sorted.get(i).getKey(), pos);
        }
        return ranking;
    }

    // ── Nuevas menciones ──────────────────────────────────────────────────────

    private void calcularContraLaCorriente(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findContraLaCorriente();
        if (rows.isEmpty())
            return;

        long veces = ((Number) rows.get(0)[3]).longValue();
        if (veces == 0)
            return;

        menciones.add(new MencionDTO(
                "CONTRA_CORRIENTE",
                "🌊",
                "Contra la corriente",
                "Acertó " + veces + " " + (veces == 1 ? "vez" : "veces") + " votando diferente a la mayoría",
                List.of(new ParticipanteResumenDTO(
                        (String) rows.get(0)[0],
                        (String) rows.get(0)[1],
                        ((Number) rows.get(0)[2]).longValue()))));
    }

    private void calcularRachaEnLlamas(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findPrediccionesOrdenadas();
        if (rows.isEmpty())
            return;

        // Agrupar por planilla y calcular racha máxima de aciertos consecutivos
        // Estructura: Map<codigoPlanilla, {nombre, apellido, rachaMax}>
        Map<Long, String[]> infoParticipante = new LinkedHashMap<>(); // codigo → [nombre, apellido]
        Map<Long, List<Boolean>> aciertos = new LinkedHashMap<>();

        for (Object[] row : rows) {
            Long codigo = ((Number) row[0]).longValue();
            String nombre = (String) row[1];
            String apellido = (String) row[2];
            boolean acierto = (Boolean) row[4];

            infoParticipante.putIfAbsent(codigo, new String[] { nombre, apellido });
            aciertos.computeIfAbsent(codigo, k -> new ArrayList<>()).add(acierto);
        }

        Long mejorCodigo = null;
        int mejorRacha = 0;

        for (Map.Entry<Long, List<Boolean>> entry : aciertos.entrySet()) {
            int rachaActual = 0;
            int rachaMax = 0;
            for (boolean a : entry.getValue()) {
                if (a) {
                    rachaActual++;
                    rachaMax = Math.max(rachaMax, rachaActual);
                } else {
                    rachaActual = 0;
                }
            }
            if (rachaMax > mejorRacha) {
                mejorRacha = rachaMax;
                mejorCodigo = entry.getKey();
            }
        }

        if (mejorCodigo == null || mejorRacha < 2)
            return; // racha mínima de 2

        String[] info = infoParticipante.get(mejorCodigo);
        menciones.add(new MencionDTO(
                "RACHA_EN_LLAMAS",
                "🔥",
                "Racha en llamas",
                "Mayor racha de aciertos consecutivos: " + mejorRacha + " partido"
                        + (mejorRacha != 1 ? "s" : "") + " seguidos",
                List.of(new ParticipanteResumenDTO(info[0], info[1], mejorCodigo))));
    }

    private void calcularElTapado(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findTop10Puntajes();
        if (rows.isEmpty())
            return;

        // Verificar que hay resultados suficientes para que sea significativo
        long maxPuntos = ((Number) rows.get(0)[3]).longValue();
        if (maxPuntos == 0)
            return;

        // El de mayor código entre el top 10 = el que se registró más tarde
        Object[] tapado = rows.stream()
                .max(Comparator.comparingLong(r -> ((Number) r[2]).longValue()))
                .orElse(null);

        if (tapado == null)
            return;

        long puntos = ((Number) tapado[3]).longValue();
        menciones.add(new MencionDTO(
                "EL_TAPADO",
                "🕵️",
                "El Tapado",
                "Se anotó de los últimos y está en el top 10 con "
                        + puntos + " punto" + (puntos != 1 ? "s" : ""),
                List.of(new ParticipanteResumenDTO(
                        (String) tapado[0],
                        (String) tapado[1],
                        ((Number) tapado[2]).longValue()))));
    }

    private void calcularEspecialistaX2(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findEspecialistaX2();
        if (rows.isEmpty())
            return;

        long aciertosX2 = ((Number) rows.get(0)[3]).longValue();
        long totalX2 = ((Number) rows.get(0)[4]).longValue();
        if (aciertosX2 == 0)
            return;

        int pct = (int) Math.round((aciertosX2 * 100.0) / totalX2);

        menciones.add(new MencionDTO(
                "ESPECIALISTA_X2",
                "💥",
                "El Especialista X2",
                "Acertó el " + pct + "% de los partidos dobles ("
                        + aciertosX2 + "/" + totalX2 + ")",
                List.of(new ParticipanteResumenDTO(
                        (String) rows.get(0)[0],
                        (String) rows.get(0)[1],
                        ((Number) rows.get(0)[2]).longValue()))));
    }

    private void calcularElArranque(List<MencionDTO> menciones) {
        List<Object[]> rows = mencionRepository.findElArranque();
        if (rows.isEmpty())
            return;

        List<ParticipanteResumenDTO> participantes = rows.stream()
                .map(r -> new ParticipanteResumenDTO(
                        (String) r[0],
                        (String) r[1],
                        ((Number) r[2]).longValue()))
                .toList();

        menciones.add(new MencionDTO(
                "EL_ARRANQUE",
                "🚀",
                "El Arranque",
                "Acertó los primeros 3 partidos del torneo",
                participantes));
    }
}