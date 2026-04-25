package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Resultado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResultadoRepository extends JpaRepository<Resultado, Long> {

    Optional<Resultado> findByPartidoId(Long partidoId);

    // Trae todos los resultados con el partido ya cargado (evita N+1)
    @Query("SELECT r FROM Resultado r JOIN FETCH r.partido p ORDER BY p.numero ASC")
    List<Resultado> findAllWithPartido();
}