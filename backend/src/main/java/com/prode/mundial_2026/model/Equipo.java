package com.prode.mundial_2026.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @Entity le dice a Hibernate que esta clase es una tabla de la DB
// @Table define el nombre exacto de la tabla en PostgreSQL
// @Data (Lombok) genera automáticamente: getters, setters, toString, equals, hashCode
// @NoArgsConstructor genera: public Equipo() {}
// @AllArgsConstructor genera: public Equipo(id, nombre, ...) {}
@Entity
@Table(name = "equipos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Equipo {

    // @Id → es la clave primaria
    // @GeneratedValue → PostgreSQL genera el valor automáticamente (SERIAL)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // @Column(nullable = false) → NOT NULL en la DB
    @Column(nullable = false, length = 50)
    private String nombre; // ej: "argentina" (para lógica interna)

    @Column(name = "nombre_show", nullable = false, length = 50)
    private String nombreShow; // ej: "Argentina" (para mostrar en pantalla)

    @Column(length = 1)
    private String grupo; // "A", "B", ... "L" (12 grupos en 2026)

    @Column(name = "bandera_url", length = 100)
    private String banderaUrl; // ruta a la imagen de la bandera
}
