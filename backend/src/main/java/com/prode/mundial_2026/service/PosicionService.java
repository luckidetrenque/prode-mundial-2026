package com.prode.mundial_2026.service;

import com.prode.mundial_2026.dto.PosicionDTO;
import com.prode.mundial_2026.repository.PosicionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PosicionService {

    private final PosicionRepository posicionRepository;

    /**
     * FIX #14: El algoritmo anterior ejecutaba 1 query por planilla confirmada
     * para cargar sus predicciones (problema N+1).
     * Con 500 planillas y 72 partidos → 500 queries por cada request a /posiciones.
     *
     * Solución: una única query SQL agregada en PosicionRepository que calcula
     * los aciertos directamente en la DB con un JOIN entre predicciones y
     * resultados.
     * La DB hace el trabajo pesado en O(n) con índices, no la JVM.
     *
     * Flujo nuevo:
     * 1. Una query trae { usuarioId, nombre, apellido, email, codigoPlanilla,
     * puntos }
     * agrupado por planilla, filtrando solo confirmadas.
     * 2. Una segunda query cuenta el total de resultados cargados.
     * 3. Se asignan posiciones en memoria (lista ya ordenada por puntos DESC).
     */
    public List<PosicionDTO> calcularPosiciones() {

        // Query 1: total de partidos con resultado cargado
        int totalPartidos = posicionRepository.countResultadosCargados();
        if (totalPartidos == 0) {
            return Collections.emptyList();
        }

        // Query 2: puntos por planilla (JOIN predicciones ∩ resultados, agrupado)
        List<Object[]> rows = posicionRepository.calcularPuntajesPorPlanilla();

        List<PosicionDTO> posiciones = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            String nombre = (String) row[0];
            String apellido = (String) row[1];
            String email = (String) row[2];
            Long codigoPlanilla = (Long) row[3];
            Long puntos = (Long) row[4]; // COUNT del JOIN

            posiciones.add(new PosicionDTO(
                    0,
                    nombre,
                    apellido,
                    email,
                    codigoPlanilla,
                    puntos.intValue(),
                    totalPartidos));
        }

        // Ordenar por puntos DESC (la query ya lo hace, pero reforzamos aquí)
        posiciones.sort((a, b) -> b.getPuntos() - a.getPuntos());

        // Asignar posiciones con empates compartidos
        int pos = 1;
        for (int i = 0; i < posiciones.size(); i++) {
            if (i > 0 && posiciones.get(i).getPuntos() < posiciones.get(i - 1).getPuntos()) {
                pos = i + 1;
            }
            posiciones.get(i).setPosicion(pos);
        }

        return posiciones;
    }
}