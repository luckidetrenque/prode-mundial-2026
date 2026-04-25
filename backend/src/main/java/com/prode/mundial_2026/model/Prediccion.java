package com.prode.mundial_2026.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "predicciones",
        // Restricción de unicidad: una planilla solo puede tener
        // UNA predicción por partido
        uniqueConstraints = @UniqueConstraint(columnNames = { "planilla_id", "partido_id" }))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Prediccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planilla_id", nullable = false)
    private Planilla planilla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partido_id", nullable = false)
    private Partido partido;

    // Qué predijo el participante para este partido
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResultadoPrediccion prediccion;

    public enum ResultadoPrediccion {
        LOCAL, // gana el equipo local
        EMPATE, // empate
        VISITANTE // gana el equipo visitante
    }
}
