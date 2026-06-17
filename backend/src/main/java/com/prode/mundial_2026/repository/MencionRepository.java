// backend/src/main/java/com/prode/mundial_2026/repository/MencionRepository.java
package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Planilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MencionRepository extends JpaRepository<Planilla, Long> {

    /**
     * Cuenta aciertos por partido entre planillas confirmadas.
     * Retorna: [partidoId, cantidadAcertadores]
     */
    @Query("""
            SELECT
                pa.id,
                COUNT(pr.id)
            FROM Prediccion pr
            JOIN pr.planilla pl
            JOIN pr.partido pa
            JOIN Resultado r ON r.partido = pa
            WHERE pl.confirmada = true
              AND pr.prediccion = r.resultado
            GROUP BY pa.id
            HAVING COUNT(pr.id) = 1
            """)
    List<Object[]> findPartidosConExactamenteUnAcierto();

    /**
     * Dado un partido, trae los datos del único acertador.
     * Retorna: [partidoId, numeroPartido, equipoLocal, equipoVisitante,
     * nombre, apellido, codigoPlanilla]
     */
    @Query("""
            SELECT
                pa.id,
                pa.numero,
                el.nombreShow,
                ev.nombreShow,
                u.nombre,
                u.apellido,
                pl.codigo
            FROM Prediccion pr
            JOIN pr.planilla pl
            JOIN pl.usuario u
            JOIN pr.partido pa
            JOIN pa.equipoLocal el
            JOIN pa.equipoVisitante ev
            JOIN Resultado r ON r.partido = pa
            WHERE pl.confirmada = true
              AND pr.prediccion = r.resultado
              AND pa.id IN :partidoIds
            ORDER BY pa.numero ASC
            """)
    List<Object[]> findAcertadoresPorPartidos(
            @Param("partidoIds") List<Long> partidoIds);

    /**
     * Partido con menor porcentaje de aciertos (el más difícil).
     * Retorna: [partidoId, numeroPartido, equipoLocal, equipoVisitante,
     * nombre, apellido, codigoPlanilla]
     */
    @Query("""
            SELECT
                pa.id,
                pa.numero,
                el.nombreShow,
                ev.nombreShow,
                u.nombre,
                u.apellido,
                pl.codigo
            FROM Prediccion pr
            JOIN pr.planilla pl
            JOIN pl.usuario u
            JOIN pr.partido pa
            JOIN pa.equipoLocal el
            JOIN pa.equipoVisitante ev
            JOIN Resultado r ON r.partido = pa
            WHERE pl.confirmada = true
              AND pr.prediccion = r.resultado
              AND pa.id = (
                  SELECT r2.partido.id
                  FROM Resultado r2
                  WHERE r2.partido.id IN (
                      SELECT DISTINCT pr3.partido.id
                      FROM Prediccion pr3
                      JOIN pr3.planilla pl3
                      WHERE pl3.confirmada = true
                  )
                  GROUP BY r2.partido.id
                  ORDER BY (
                      SELECT COUNT(pr4.id)
                      FROM Prediccion pr4
                      JOIN pr4.planilla pl4
                      JOIN Resultado r4 ON r4.partido = pr4.partido
                      WHERE pl4.confirmada = true
                        AND pr4.prediccion = r4.resultado
                        AND pr4.partido.id = r2.partido.id
                  ) ASC
                  LIMIT 1
              )
            """)
    List<Object[]> findAcertadoresDiamante();

     /**
     * Participante con más puntos en partidos x2.
     * Retorna: [nombre, apellido, codigoPlanilla, puntosX2]
     */
    @Query("""
            SELECT
                u.nombre,
                u.apellido,
                pl.codigo,
                SUM(pa.multiplicador)
            FROM Prediccion pr
            JOIN pr.planilla pl
            JOIN pl.usuario u
            JOIN pr.partido pa
            JOIN Resultado r ON r.partido = pa
            WHERE pl.confirmada = true
              AND pr.prediccion = r.resultado
              AND pa.multiplicador > 1
            GROUP BY pl.id, u.nombre, u.apellido, pl.codigo
            ORDER BY SUM(pa.multiplicador) DESC
            LIMIT 1
            """)
    List<Object[]> findMasX2();

    /**
     * Participante con más empates acertados.
     * Retorna: [nombre, apellido, codigoPlanilla, cantidadEmpates]
     */
    @Query("""
            SELECT
                u.nombre,
                u.apellido,
                pl.codigo,
                COUNT(pr.id)
            FROM Prediccion pr
            JOIN pr.planilla pl
            JOIN pl.usuario u
            JOIN Resultado r ON r.partido = pr.partido
            WHERE pl.confirmada = true
              AND pr.prediccion = 'EMPATE'
              AND r.resultado = 'EMPATE'
            GROUP BY pl.id, u.nombre, u.apellido, pl.codigo
            ORDER BY COUNT(pr.id) DESC
            LIMIT 1
            """)
    List<Object[]> findMasEmpatador();

    /**
     * Participante que más veces votó igual que la mayoría.
     * Retorna: [nombre, apellido, codigoPlanilla, vecesConMayoria]
     */
    @Query("""
            SELECT
                u.nombre,
                u.apellido,
                pl.codigo,
                COUNT(pr.id)
            FROM Prediccion pr
            JOIN pr.planilla pl
            JOIN pl.usuario u
            WHERE pl.confirmada = true
              AND pr.prediccion = (
                  SELECT pr2.prediccion
                  FROM Prediccion pr2
                  JOIN pr2.planilla pl2
                  WHERE pl2.confirmada = true
                    AND pr2.partido = pr.partido
                  GROUP BY pr2.prediccion
                  ORDER BY COUNT(pr2.id) DESC
                  LIMIT 1
              )
            GROUP BY pl.id, u.nombre, u.apellido, pl.codigo
            ORDER BY COUNT(pr.id) DESC
            LIMIT 1
            """)
    List<Object[]> findMasConsenso();

    /**
     * Puntaje total por participante (para puntero, resistente, remontada/bajón).
     * Retorna: [nombre, apellido, codigoPlanilla, puntos]
     */
    @Query("""
            SELECT
                u.nombre,
                u.apellido,
                pl.codigo,
                COALESCE(SUM(CASE WHEN pr.prediccion = r.resultado
                              THEN pa.multiplicador ELSE 0 END), 0) AS puntos
            FROM Planilla pl
            JOIN pl.usuario u
            LEFT JOIN pl.predicciones pr
            LEFT JOIN pr.partido pa
            LEFT JOIN Resultado r ON r.partido = pa
            WHERE pl.confirmada = true
            GROUP BY pl.id, u.nombre, u.apellido, pl.codigo
            ORDER BY puntos DESC
            """)
    List<Object[]> findPuntajeGeneral();

    /**
     * Participantes que acertaron todos los partidos de un mismo día.
     * Retorna: [fecha (DATE), nombre, apellido, codigoPlanilla]
     *
     * CAST(pa.fechaHora AS DATE) agrupa por día calendario ignorando la hora.
     * Solo cuenta días donde haya al menos 1 resultado cargado.
     */
    @Query(value = """
        SELECT
            CAST(pa.fecha_hora AS DATE)   AS fecha,
            u.nombre,
            u.apellido,
            pl.codigo
        FROM predicciones pr
        JOIN planillas    pl ON pl.id = pr.planilla_id
        JOIN usuarios     u  ON u.id  = pl.usuario_id
        JOIN partidos     pa ON pa.id = pr.partido_id
        JOIN resultados   r  ON r.partido_id = pa.id
        WHERE pl.confirmada = true
          AND pr.prediccion  = r.resultado
        GROUP BY CAST(pa.fecha_hora AS DATE), pl.id, u.nombre, u.apellido, pl.codigo
        HAVING COUNT(pr.id) = (
            SELECT COUNT(pa2.id)
            FROM partidos  pa2
            JOIN resultados r2 ON r2.partido_id = pa2.id
            WHERE CAST(pa2.fecha_hora AS DATE) = CAST(pa.fecha_hora AS DATE)
        )
        ORDER BY CAST(pa.fecha_hora AS DATE) ASC
        """, nativeQuery = true)
    List<Object[]> findDiaPerfecto();

    /**
     * Puntaje obtenido por cada participante en cada día calendario.
     * Retorna: [fecha (DATE), nombre, apellido, codigoPlanilla, puntosEnElDia]
     *
     * Solo incluye días con al menos 1 resultado cargado.
     */
    @Query(value = """
        SELECT
            CAST(pa.fecha_hora AS DATE)   AS fecha,
            u.nombre,
            u.apellido,
            pl.codigo,
            COALESCE(SUM(
                CASE WHEN pr.prediccion = r.resultado
                    THEN pa.multiplicador ELSE 0 END
            ), 0)                         AS puntos_dia
        FROM planillas    pl
        JOIN usuarios     u  ON u.id  = pl.usuario_id
        LEFT JOIN predicciones pr ON pr.planilla_id = pl.id
        LEFT JOIN partidos     pa ON pa.id = pr.partido_id
        LEFT JOIN resultados   r  ON r.partido_id  = pa.id
        WHERE pl.confirmada = true
          AND pa.fecha_hora IS NOT NULL
        GROUP BY CAST(pa.fecha_hora AS DATE), pl.id, u.nombre, u.apellido, pl.codigo
        ORDER BY CAST(pa.fecha_hora AS DATE) ASC, pl.codigo ASC
        """, nativeQuery = true)
    List<Object[]> findPuntajePorDia();
}