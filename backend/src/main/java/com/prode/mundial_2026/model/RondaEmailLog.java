package com.prode.mundial_2026.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Registro de emails de ronda ya enviados.
 *
 * Persiste en DB para sobrevivir reinicios del servidor.
 * Una fila por ronda enviada (rondaNumero = 1, 2 o 3).
 *
 * El scheduler de cada ronda verifica que NO exista una fila
 * con su número antes de disparar el envío.
 */
@Entity
@Table(name = "ronda_email_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RondaEmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Número de ronda: 1, 2 o 3.
     * unique = true garantiza que no pueda insertarse dos veces la misma ronda.
     */
    @Column(name = "ronda_numero", nullable = false, unique = true)
    private Integer rondaNumero;

    @Column(name = "enviado_en", nullable = false)
    private LocalDateTime enviadoEn;

    @Column(name = "total_enviados", nullable = false)
    private Integer totalEnviados;

    @Column(name = "total_errores", nullable = false)
    private Integer totalErrores;

    public RondaEmailLog(Integer rondaNumero, LocalDateTime enviadoEn,
                         Integer totalEnviados, Integer totalErrores) {
        this.rondaNumero  = rondaNumero;
        this.enviadoEn    = enviadoEn;
        this.totalEnviados = totalEnviados;
        this.totalErrores  = totalErrores;
    }
}
