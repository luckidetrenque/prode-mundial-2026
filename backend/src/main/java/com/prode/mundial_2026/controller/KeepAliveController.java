package com.prode.mundial_2026.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.scheduling.annotation.Scheduled;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.util.logging.Logger;

@RestController
public class KeepAliveController {

    private static final Logger logger = Logger.getLogger(KeepAliveController.class.getName());

    @Value("${RENDER_EXTERNAL_URL:http://localhost:8080}")
    private String renderExternalUrl;

    // Endpoint simple que responde rápido para validar que la app está viva
    @GetMapping("/health")
    public String healthCheck() {
        return "OK";
    }

    /**
     * Se ejecuta cada 14 minutos (840,000 milisegundos).
     * Esto evita que Render ponga la instancia en reposo por inactividad.
     */
    @Scheduled(fixedRate = 840000)
    public void selfPing() {
        try {
            String healthUrl = renderExternalUrl + "/health";
            
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(healthUrl))
                    .GET()
                    .build();
            
            client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                  .thenAccept(response -> {
                      if (response.statusCode() == 200) {
                          logger.info("Keep-alive enviado exitosamente a " + healthUrl + ". Estado: " + response.statusCode());
                      } else {
                          logger.warning("Keep-alive enviado a " + healthUrl + " pero retornó estado: " + response.statusCode());
                      }
                  });
                  
        } catch (Exception e) {
            logger.severe("Error en el auto-ping de Render: " + e.getMessage());
        }
    }
}
