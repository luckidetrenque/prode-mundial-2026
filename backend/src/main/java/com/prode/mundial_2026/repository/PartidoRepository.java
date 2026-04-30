// ─── PartidoRepository.java ───────────────────────────────────────────────────
package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Partido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

// JpaRepository<Partido, Long> nos da gratis:
//   save(), findById(), findAll(), deleteById(), count(), etc.
// Solo necesitamos agregar los métodos específicos que necesitemos.
@Repository
public interface PartidoRepository extends JpaRepository<Partido, Long> {

    // Spring genera la consulta SQL a partir del nombre del método:
    // SELECT * FROM partidos WHERE fase = ?
    List<Partido> findByFaseOrderByNumeroAsc(Partido.FasePartido fase);

    // Para evitar el problema N+1 (múltiples consultas para cargar los equipos),
    // usamos JOIN FETCH que trae todo en una sola consulta SQL
    @Query("SELECT p FROM Partido p " +
            "JOIN FETCH p.equipoLocal " +
            "JOIN FETCH p.equipoVisitante " +
            "ORDER BY p.numero ASC")
    List<Partido> findAllWithEquipos();

    List<Partido> findByGrupo(String grupo);

    boolean existsByNumero(Integer numero);
}
