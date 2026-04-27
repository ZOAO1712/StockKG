package com.stockkg.backend.controller;

import com.stockkg.backend.dto.ChatRequest;
import com.stockkg.backend.service.DeepSeekStreamService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin
public class AiChatStreamController {

    private final DeepSeekStreamService deepSeekStreamService;

    public AiChatStreamController(DeepSeekStreamService deepSeekStreamService) {
        this.deepSeekStreamService = deepSeekStreamService;
    }

    @PostMapping("/chat/stream")
    public SseEmitter streamChat(@RequestBody ChatRequest request) {
        return deepSeekStreamService.streamChat(request);
    }
}