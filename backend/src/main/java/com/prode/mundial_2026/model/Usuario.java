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

    // unique = true → no puede haber dos usuarios con el mismo número de afiliado
    @Column(nullable = false, unique = true)
    private Integer afiliado;

    @Column(length = 100)
    private String email;

    // Solo los admins tienen password; los participantes no se logean
    @Column(name = "es_admin")
    private Boolean esAdmin = false;

    // Guardamos la password cifrada con BCrypt (nunca en texto plano)
    @Column(length = 100)
    private String password;
}
