package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Planilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanillaRepository extends JpaRepository<Planilla, Long> {

    Optional<Planilla> findByCodigo(Long codigo);

    // Solo las planillas confirmadas aparecen en la lista pública
    List<Planilla> findByConfirmadaTrueOrderByIdAsc();

    @Query("SELECT COUNT(p) FROM Planilla p WHERE p.confirmada = false")
    long countPendientes();

    // Verifica si un email ya tiene planilla (regla: una por email)
    @Query("SELECT COUNT(p) > 0 FROM Planilla p WHERE p.usuario.email = :email")
    boolean existsByEmail(String email);

    // Para el admin: ver todas las planillas (confirmadas o no)
    @Query("SELECT p FROM Planilla p JOIN FETCH p.usuario ORDER BY p.id DESC")
    List<Planilla> findAllWithUsuario();
}