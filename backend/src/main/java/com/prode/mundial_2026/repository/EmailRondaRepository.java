package com.prode.mundial_2026.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.prode.mundial_2026.model.Resultado;

import java.util.List;

/**
 * Queries auxiliares para el email de ronda.
 *
 * Se extiende de JpaRepository<Resultado, Long> para reutilizar
 * la infraestructura JPA sin necesitar una nueva entidad raíz.
 */
@Repository
public interface EmailRondaRepository extends JpaRepository<Resultado, Long> {

    /**
     * Cuenta cuántos resultados están cargados para los partidos de una jornada.
     * Se usa para validar que la ronda esté 100% completa antes de enviar.
     *
     * @param jornada  número de jornada (1, 2 o 3)
     * @return cantidad de resultados cargados para esa jornada
     */
    @Query("""
            SELECT COUNT(r) FROM Resultado r
            WHERE r.partido.jornada = :jornada
            """)
    int countResultadosPorJornada(@Param("jornada") int jornada);

    /**
     * Para cada planilla confirmada, calcula:
     *   - aciertos en la ronda indicada (prediccion = resultado, mismo partido, misma jornada)
     *   - puntos acumulados totales (todas las jornadas hasta ahora, con multiplicador)
     *
     * Retorna Object[] con:
     *   [0] nombre        String
     *   [1] apellido      String
     *   [2] email         String
     *   [3] codigoPlanilla Long
     *   [4] aciertosRonda  Long  — aciertos solo en esta jornada (sin multiplicador, es un conteo)
     *   [5] puntosTotal    Long  — puntos acumulados totales (con multiplicador)
     *
     * Nota: aciertosRonda no aplica multiplicador porque representa
     * "partidos que acertaste en esta ronda", no puntos.
     * puntosTotal sí aplica multiplicador para reflejar el puntaje real.
     */
    @Query("""
            SELECT
                u.nombre,
                u.apellido,
                u.email,
                pl.codigo,
                SUM(CASE
                    WHEN pr.prediccion = r.resultado
                         AND pa.jornada = :jornada
                    THEN 1 ELSE 0 END) AS aciertosRonda,
                COALESCE(SUM(CASE
                    WHEN pr.prediccion = r.resultado
                    THEN pa.multiplicador ELSE 0 END), 0) AS puntosTotal
            FROM Planilla pl
            JOIN pl.usuario u
            JOIN pl.predicciones pr
            JOIN pr.partido pa
            LEFT JOIN Resultado r ON r.partido = pa
            WHERE pl.confirmada = true
            GROUP BY pl.id, u.nombre, u.apellido, u.email, pl.codigo
            ORDER BY puntosTotal DESC
            """)
    List<Object[]> calcularStatsRonda(@Param("jornada") int jornada);
}
