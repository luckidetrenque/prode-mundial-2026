package com.prode.mundial_2026.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Value("${app.show-error-details:false}")
    private boolean showErrorDetails;

    /**
     * FIX #11: Se introduce BusinessException como jerarquía tipada para
     * errores de negocio controlados (planilla no encontrada, email duplicado,
     * etc.).
     *
     * Esto reemplaza el antipatrón de usar RuntimeException genérica con mensajes
     * que podían contener información interna (stack traces, nombres de tablas,
     * URLs de DB, etc.) y exponerla al cliente.
     *
     * Todos los services deben usar BusinessException (o sus subclases) para
     * errores esperados, y dejar RuntimeException para errores genuinamente
     * inesperados.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, String>> handleBusinessException(BusinessException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", ex.getMessage());
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    /**
     * FIX #11: RuntimeException genérica ya NO expone ex.getMessage() al cliente.
     * Solo se muestra el detalle en modo desarrollo (app.show-error-details=true).
     * En producción, el cliente recibe un mensaje genérico y el detalle queda en
     * logs.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        // Loguear el error real (en producción iría a un sistema de logs centralizado)
        System.err.println("[ERROR] RuntimeException no controlada: " + ex.getMessage());

        if (showErrorDetails) {
            // Solo en desarrollo: se muestra el mensaje interno
            response.put("error", ex.getMessage());
        } else {
            // En producción: mensaje genérico, sin filtrar internals
            response.put("error", "Error en la operación solicitada. Intentá nuevamente.");
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException ex) {
        String errores = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        Map<String, String> response = new HashMap<>();
        response.put("error", errores);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(
            ConstraintViolationException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "Datos inválidos en la solicitud.");
        if (showErrorDetails) {
            response.put("detalle", ex.getMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        System.err.println("[ERROR] Excepción inesperada: " + ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Ha ocurrido un error inesperado. Intente nuevamente.");
        if (showErrorDetails) {
            response.put("detalle", ex.getMessage());
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}