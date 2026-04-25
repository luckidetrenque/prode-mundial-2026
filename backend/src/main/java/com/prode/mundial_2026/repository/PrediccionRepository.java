package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Prediccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrediccionRepository extends JpaRepository<Prediccion, Long> {

    // Trae todas las predicciones de una planilla con sus partidos en una sola
    // consulta
    @Query("SELECT pr FROM Prediccion pr " +
            "JOIN FETCH pr.partido pa " +
            "JOIN FETCH pa.equipoLocal " +
            "JOIN FETCH pa.equipoVisitante " +
            "WHERE pr.planilla.id = :planillaId " +
            "ORDER BY pa.numero ASC")
    List<Prediccion> findByPlanillaIdWithPartido(Long planillaId);

    // Para estadísticas: cuenta votos agrupados por partido y resultado
    @Query("SELECT pr.partido.id, pr.prediccion, COUNT(pr) " +
            "FROM Prediccion pr " +
            "WHERE pr.planilla.confirmada = true " +
            "GROUP BY pr.partido.id, pr.prediccion")
    List<Object[]> countVotesByPartidoAndResultado();
}