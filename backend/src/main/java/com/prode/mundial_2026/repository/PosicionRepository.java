package com.prode.mundial_2026.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.prode.mundial_2026.model.Planilla;

import java.util.List;

/**
 * FIX #14: Repositorio dedicado para el cálculo de posiciones.
 *
 * Reemplaza el loop O(n×m) del PosicionService original que ejecutaba
 * una query por cada planilla confirmada.
 *
 * Las dos queries aquí hacen todo el trabajo en la DB:
 * - calcularPuntajesPorPlanilla: JOIN entre predicciones y resultados,
 * agrupado por planilla, ordenado por puntos DESC.
 * - countResultadosCargados: total de partidos con resultado oficial.
 */
@Repository
public interface PosicionRepository extends JpaRepository<Planilla, Long> {

    /**
     * Calcula los puntos de cada planilla confirmada en una sola query.
     *
     * Lógica:
     * - JOIN Prediccion con Resultado en partido_id
     * - Filtra predicciones donde prediccion = resultado (acierto)
     * - Agrupa por planilla y cuenta los aciertos
     * - Ordena por puntos DESC para simplificar la asignación de posiciones
     *
     * Retorna Object[] con: [nombre, apellido, email, codigoPlanilla, puntos]
     */
    @Query("""
            SELECT
                u.nombre,
                u.apellido,
                u.email,
                pl.codigo,
                SUM(p.multiplicador) AS puntos
            FROM Planilla pl
            JOIN pl.usuario u
            JOIN pl.predicciones pr
            JOIN pr.partido p
            JOIN Resultado r ON r.partido = p
            WHERE pl.confirmada = true
              AND pr.prediccion = r.resultado
            GROUP BY pl.id, u.nombre, u.apellido, u.email, pl.codigo
            ORDER BY puntos DESC
            """)
    List<Object[]> calcularPuntajesPorPlanilla();

    /**
     * Total de partidos con resultado oficial cargado.
     * Determina cuántos partidos se están computando en la tabla.
     */
    @Query("SELECT COUNT(r) FROM Resultado r")
    int countResultadosCargados();
}