package com.stockkg.backend.controller;

import com.stockkg.backend.dto.ChatRequest;
import com.stockkg.backend.dto.StructuredAnswer;
import com.stockkg.backend.service.DeepSeekService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin
public class AiChatController {

    private final DeepSeekService deepSeekService;

    public AiChatController(DeepSeekService deepSeekService) {
        this.deepSeekService = deepSeekService;
    }

    @PostMapping("/chat/json")
    public Map<String, Object> chatJson(@RequestBody ChatRequest request) {
        StructuredAnswer data = deepSeekService.chatJson(
                request.getMessages(),
                request.getTemperature()
        );

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("data", data);
        return result;
    }
}