package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Planilla;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanillaRepository extends JpaRepository<Planilla, Long> {

    Optional<Planilla> findByCodigo(Long codigo);

    List<Planilla> findByConfirmadaTrueOrderByIdAsc();

    @Query("SELECT COUNT(p) FROM Planilla p WHERE p.confirmada = false")
    long countPendientes();

    @Query("SELECT COUNT(p) > 0 FROM Planilla p WHERE p.usuario.email = :email")
    boolean existsByEmail(String email);

    /**
     * FIX #12: Necesario para verificar unicidad del código aleatorio
     * antes de persistir la planilla, evitando colisiones.
     */
    boolean existsByCodigo(Long codigo);

    // FIX #13: Versión paginada para el endpoint de admin.
    // Evita cargar TODAS las planillas en memoria cuando hay miles de registros.
    @Query("SELECT p FROM Planilla p JOIN FETCH p.usuario ORDER BY p.id DESC")
    Page<Planilla> findAllWithUsuarioPaged(Pageable pageable);

    // Se mantiene la versión sin paginar para compatibilidad interna si se necesita
    @Query("SELECT p FROM Planilla p JOIN FETCH p.usuario ORDER BY p.id DESC")
    List<Planilla> findAllWithUsuario();
}