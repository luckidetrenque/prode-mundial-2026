package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.PosicionEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PosicionEquipoRepository extends JpaRepository<PosicionEquipo, Long> {
    Optional<PosicionEquipo> findByNombreEquipo(String nombreEquipo);

    // Recupera todo ordenado bajo criterios FIFA oficiales (Puntos -> Diferencia ->
    // Goles Favor)
    List<PosicionEquipo> findAllByOrderByGrupoAscPuntosDescDiferenciaGolesDescGolesFavorDesc();
}
