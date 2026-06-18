package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Planilla;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

  boolean existsByCodigo(Long codigo);

  @Query("SELECT p FROM Planilla p JOIN FETCH p.usuario ORDER BY p.id DESC")
  Page<Planilla> findAllWithUsuarioPaged(Pageable pageable);

  @Query("SELECT p FROM Planilla p JOIN FETCH p.usuario ORDER BY p.id DESC")
  List<Planilla> findAllWithUsuario();

  /**
   * NUEVO: Carga la planilla con todas sus predicciones y partidos en una sola
   * query.
   * Necesario para el EmailService: evita LazyInitializationException cuando
   * se accede a planilla.getPredicciones() fuera del contexto transaccional
   * original (el hilo @Async tiene su propio contexto).
   */
  @Query("""
      SELECT DISTINCT p FROM Planilla p
      JOIN FETCH p.usuario
      JOIN FETCH p.predicciones pr
      JOIN FETCH pr.partido pa
      LEFT JOIN FETCH pa.equipoLocal
      LEFT JOIN FETCH pa.equipoVisitante
      WHERE p.codigo = :codigo
      """)
  Optional<Planilla> findByCodigoWithPredicciones(Long codigo);

  @Query("""
      SELECT u.apellido, u.nombre, pl.codigo
      FROM Planilla pl
      JOIN pl.usuario u
      JOIN pl.predicciones pr
      JOIN pr.partido pa
      WHERE pa.id = :partidoId
        AND pr.prediccion = :prediccion
        AND pl.confirmada = true
      ORDER BY u.apellido ASC, u.nombre ASC
      """)
  List<Object[]> buscarUsuariosPorPrediccionRaw(
      @Param("partidoId") Long partidoId,
      @Param("prediccion") com.prode.mundial_2026.model.Prediccion.ResultadoPrediccion prediccion);
}
