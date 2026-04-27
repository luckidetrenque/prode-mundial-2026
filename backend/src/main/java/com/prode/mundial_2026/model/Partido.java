package com.prode.mundial_2026.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "partidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Partido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Número del partido del 1 al 104
    @Column(nullable = false, unique = true)
    private Integer numero;

    // @ManyToOne → muchos partidos pueden tener el mismo equipo local
    // @JoinColumn → nombre de la columna de clave foránea en la tabla "partidos"
    // fetch = LAZY → no carga el equipo hasta que se lo pidamos (más eficiente)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_local_id")
    private Equipo equipoLocal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipo_visitante_id")
    private Equipo equipoVisitante;

    // Fase del torneo
    // Usamos @Enumerated para mapear el enum a un String en la DB
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FasePartido fase;

    @Column(length = 1)
    private String grupo; // "A".."L" (null en eliminatorias)

    private Integer jornada; // 1, 2 o 3 (solo fase de grupos)

    @Column(name = "fecha_hora")
    private LocalDateTime fechaHora;

    @Column(length = 50)
    private String sede; // "Los Angeles", "Mexico City", etc.

    // Enum anidado: define los valores válidos para "fase"
    public enum FasePartido {
        GRUPOS,
        DIECISEISAVOS,
        OCTAVOS,
        CUARTOS,
        SEMIFINAL,
        TERCER_PUESTO,
        FINAL
    }
}
