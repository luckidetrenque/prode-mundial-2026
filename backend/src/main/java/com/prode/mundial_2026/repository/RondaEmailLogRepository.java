package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.RondaEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RondaEmailLogRepository extends JpaRepository<RondaEmailLog, Long> {

    /**
     * Devuelve true si ya se enviaron los emails de esa ronda.
     * Usada por el scheduler para evitar reenvíos (incluso tras reinicios).
     */
    boolean existsByRondaNumero(Integer rondaNumero);
}
