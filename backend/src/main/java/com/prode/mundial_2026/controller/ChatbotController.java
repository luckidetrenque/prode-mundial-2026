package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.ChatRequest;
import com.prode.mundial_2026.dto.ChatResponse;
import com.prode.mundial_2026.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * FIX backend #1: Se eliminó @CrossOrigin(origins = "*").
 *
 * El problema: @CrossOrigin("*") con allowCredentials=true es inválido
 * según la spec CORS (RFC 6454 + Fetch spec). Cuando el browser envía
 * una request con credentials (cookies, Authorization header), el servidor
 * NO puede responder con Access-Control-Allow-Origin: * — debe especificar
 * un origen concreto. Algunos browsers (Chrome, Firefox modernos) rechazan
 * la respuesta en este caso con un error de CORS aunque el servidor la
 * acepte.
 *
 * SecurityConfig ya define correctamente el CORS global:
 *   - allowedOrigins con la lista de dominios del .env (no *)
 *   - allowCredentials(true)
 *   - allowedHeaders explícitos
 *
 * @CrossOrigin a nivel de controller SOBREESCRIBE parcialmente esa config,
 * pudiendo introducir inconsistencias. Como el endpoint /api/chatbot/ask
 * ya está cubierto por el patrón "/**" de SecurityConfig, no necesita
 * ninguna anotación adicional.
 */
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public ChatResponse ask(@RequestBody ChatRequest request) {
        return chatbotService.getChatResponse(request.getMessage());
    }
}