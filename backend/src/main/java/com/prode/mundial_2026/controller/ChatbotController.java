package com.prode.mundial_2026.controller;

import com.prode.mundial_2026.dto.ChatRequest;
import com.prode.mundial_2026.dto.ChatResponse;
import com.prode.mundial_2026.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public ChatResponse ask(@RequestBody ChatRequest request) {
        return chatbotService.getChatResponse(request.getMessage());
    }
}
