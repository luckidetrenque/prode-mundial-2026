package com.prode.mundial_2026.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "resultados")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resultado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // unique = true → solo puede haber un resultado por partido
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partido_id", nullable = false, unique = true)
    private Partido partido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Prediccion.ResultadoPrediccion resultado;
    // Reutilizamos el mismo enum de Prediccion: LOCAL, EMPATE, VISITANTE
}
