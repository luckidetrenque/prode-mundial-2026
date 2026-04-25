package com.prode.mundial_2026.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "planillas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Planilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cada planilla pertenece a un usuario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Código único que el participante recibe para identificar su planilla
    @Column(nullable = false, unique = true)
    private Long codigo;

    @Column(nullable = false)
    private Boolean confirmada = false;

    @Column(name = "created_at")
    private LocalDateTime creadaEn = LocalDateTime.now();

    // Una planilla tiene muchas predicciones (una por partido)
    // CascadeType.ALL → si borro la planilla, se borran sus predicciones
    // orphanRemoval → si saco una predicción de la lista, se borra de la DB
    @OneToMany(mappedBy = "planilla", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Prediccion> predicciones = new ArrayList<>();
}
