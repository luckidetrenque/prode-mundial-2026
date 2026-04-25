package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.PosicionDTO;
import com.prode.mundial_2026.model.Planilla;
import com.prode.mundial_2026.model.Prediccion;
import com.prode.mundial_2026.repository.PlanillaRepository;
import com.prode.mundial_2026.repository.PrediccionRepository;
import com.prode.mundial_2026.repository.ResultadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PosicionService {

    private final PlanillaRepository planillaRepository;
    private final PrediccionRepository prediccionRepository;
    private final ResultadoRepository resultadoRepository;

    public List<PosicionDTO> calcularPosiciones() {

        // 1. Traemos todos los resultados reales cargados hasta ahora
        // Los convertimos a un Map<partidoId, resultado> para acceso O(1)
        Map<Long, Prediccion.ResultadoPrediccion> resultadosMap = new HashMap<>();
        resultadoRepository.findAllWithPartido()
                .forEach(r -> resultadosMap.put(r.getPartido().getId(), r.getResultado()));

        int totalPartidos = resultadosMap.size(); // partidos con resultado cargado

        if (totalPartidos == 0) {
            return Collections.emptyList();
        }

        // 2. Para cada planilla confirmada, calculamos los puntos
        List<PosicionDTO> posiciones = new ArrayList<>();

        for (Planilla planilla : planillaRepository.findByConfirmadaTrueOrderByIdAsc()) {

            List<Prediccion> predicciones = prediccionRepository.findByPlanillaIdWithPartido(planilla.getId());

            int puntos = 0;
            for (Prediccion pred : predicciones) {
                Long partidoId = pred.getPartido().getId();
                // Sumamos 1 punto si la predicción coincide con el resultado real
                if (resultadosMap.containsKey(partidoId) &&
                        resultadosMap.get(partidoId) == pred.getPrediccion()) {
                    puntos++;
                }
            }

            posiciones.add(new PosicionDTO(
                    0, // posición provisional, la calculamos en el paso 3
                    planilla.getUsuario().getNombre(),
                    planilla.getUsuario().getApellido(),
                    planilla.getUsuario().getAfiliado(),
                    planilla.getCodigo(),
                    puntos,
                    totalPartidos));
        }

        // 3. Ordenamos por puntos de mayor a menor
        posiciones.sort((a, b) -> b.getPuntos() - a.getPuntos());

        // 4. Asignamos posiciones (los empatados comparten la misma)
        int pos = 1;
        for (int i = 0; i < posiciones.size(); i++) {
            if (i > 0 && posiciones.get(i).getPuntos() < posiciones.get(i - 1).getPuntos()) {
                pos = i + 1; // nueva posición solo si los puntos son distintos
            }
            posiciones.get(i).setPosicion(pos);
        }

        return posiciones;
    }
}
