package com.prode.mundial_2026.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.scheduling.annotation.Scheduled;

import jakarta.annotation.PostConstruct;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;
import java.util.logging.Logger;

@RestController
public class KeepAliveController {

    private static final Logger logger = Logger.getLogger(KeepAliveController.class.getName());

    @Value("${RENDER_EXTERNAL_URL:http://localhost:8080}")
    private String renderExternalUrl;

    /**
     * FIX backend #2: HttpClient era instanciado dentro de selfPing(), creando
     * un objeto nuevo —con su propio thread pool interno— cada 14 minutos.
     *
     * HttpClient.newHttpClient() es un objeto pesado: reserva un ExecutorService
     * y un selector de I/O. Instanciarlo repetidamente:
     *   a) crea y destruye thread pools sin necesidad
     *   b) puede causar thread leaks si el GC no recoge el cliente anterior
     *      antes de que el scheduler lance el siguiente ping
     *
     * Solución: cliente singleton inicializado una sola vez en @PostConstruct.
     * HttpClient es thread-safe y está diseñado para ser reutilizado.
     *
     * Se agrega también un timeout de conexión de 10 segundos para evitar que
     * un ping colgado bloquee el thread del scheduler indefinidamente.
     */
    private HttpClient httpClient;

    @PostConstruct
    void initHttpClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @GetMapping("/health")
    public String healthCheck() {
        return "OK";
    }

    /**
     * Se ejecuta cada 14 minutos (840.000 ms).
     * Evita que Render ponga la instancia en reposo por inactividad.
     */
    @Scheduled(fixedRate = 840_000)
    public void selfPing() {
        try {
            String healthUrl = renderExternalUrl + "/health";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(healthUrl))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            // sendAsync: no bloquea el thread del scheduler
            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> {
                        if (response.statusCode() == 200) {
                            logger.info("Keep-alive OK → " + healthUrl
                                    + " [" + response.statusCode() + "]");
                        } else {
                            logger.warning("Keep-alive a " + healthUrl
                                    + " devolvió estado: " + response.statusCode());
                        }
                    })
                    .exceptionally(ex -> {
                        // Capturamos errores del CompletableFuture (timeout, conexión rechazada, etc.)
                        logger.severe("Error en keep-alive a " + healthUrl + ": " + ex.getMessage());
                        return null;
                    });

        } catch (Exception e) {
            logger.severe("Error inesperado en selfPing: " + e.getMessage());
        }
    }
}