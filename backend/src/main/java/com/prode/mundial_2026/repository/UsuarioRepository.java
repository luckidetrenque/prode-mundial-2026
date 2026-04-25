package com.prode.mundial_2026.repository;

import com.prode.mundial_2026.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Para autenticar al admin buscamos por número de afiliado
    Optional<Usuario> findByAfiliado(Integer afiliado);

    boolean existsByAfiliado(Integer afiliado);
}