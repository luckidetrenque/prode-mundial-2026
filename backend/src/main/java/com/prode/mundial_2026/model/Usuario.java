package com.prode.mundial_2026.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String apellido;

    @Column(nullable = false, unique = true)
    private Integer afiliado;

    @Column(length = 100)
    private String email;

    @Column(name = "es_admin")
    private Boolean esAdmin = false;

    @Column(length = 100)
    private String password;

    // ── FIX SEG #1 ────────────────────────────────────────────────────────────
    // tokenVersion permite invalidar JWTs existentes sin esperar a que expiren.
    // Al hacer logout se incrementa en 1. El JwtFilter compara el valor del
    // token contra el valor actual en la DB — si no coinciden, rechaza el token.
    //
    // Hibernate crea la columna automáticamente con ddl-auto=update.
    // El valor 0 por defecto es compatible con los registros existentes.
    // ─────────────────────────────────────────────────────────────────────────
    @Column(name = "token_version", nullable = false)
    private int tokenVersion = 0;
}
