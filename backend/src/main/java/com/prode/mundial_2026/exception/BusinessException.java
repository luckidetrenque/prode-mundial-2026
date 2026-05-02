package com.prode.mundial_2026.exception;

import org.springframework.http.HttpStatus;

/**
 * FIX #11: Excepción base para errores de negocio controlados.
 *
 * Los services deben lanzar esta clase (o sus subclases) para errores
 * esperados y mensajes seguros de mostrar al cliente.
 * GlobalExceptionHandler la captura y devuelve el mensaje directamente.
 *
 * Subclases recomendadas:
 * - PlanillaNotFoundException (404)
 * - PartidoNotFoundException (404)
 * - EmailDuplicadoException (409)
 * - PlanillaYaConfirmadaException (409)
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    /** Convenience: 400 Bad Request por defecto */
    public BusinessException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public HttpStatus getStatus() {
        return status;
    }

    // ── Subclases concretas ────────────────────────────────────────────────

    public static class PlanillaNotFoundException extends BusinessException {
        public PlanillaNotFoundException(Long codigo) {
            super("Planilla no encontrada con código: " + codigo, HttpStatus.NOT_FOUND);
        }
    }

    public static class PartidoNotFoundException extends BusinessException {
        public PartidoNotFoundException(Long id) {
            super("Partido no encontrado: ID " + id, HttpStatus.NOT_FOUND);
        }
    }

    public static class EmailDuplicadoException extends BusinessException {
        public EmailDuplicadoException(String email) {
            super("Ya existe una planilla para el email: " + email, HttpStatus.CONFLICT);
        }
    }

    public static class PlanillaYaConfirmadaException extends BusinessException {
        public PlanillaYaConfirmadaException(Long codigo) {
            super("La planilla " + codigo + " ya está confirmada.", HttpStatus.CONFLICT);
        }
    }
}