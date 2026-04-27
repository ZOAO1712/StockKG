package com.stockkg.backend.service;

import com.stockkg.backend.dto.ChatRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class DeepSeekStreamService {

    @Value("${deepseek.api-key}")
    private String apiKey;

    @Value("${deepseek.base-url}")
    private String baseUrl;

    @Value("${deepseek.model}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OkHttpClient client = new OkHttpClient();

    public SseEmitter streamChat(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(0L);

        new Thread(() -> {
            try {
                List<Map<String, String>> msgList = new ArrayList<>();
                if (request.getMessages() != null) {
                    for (ChatRequest.Message m : request.getMessages()) {
                        Map<String, String> map = new HashMap<>();
                        map.put("role", m.getRole());
                        map.put("content", m.getContent());
                        msgList.add(map);
                    }
                }

                Map<String, Object> body = new HashMap<>();
                body.put("model", model);
                body.put("messages", msgList);
                body.put("stream", true);

                // reasoner 线路先不传 temperature，官方文档说明这类参数对它无效或不支持
                String json = objectMapper.writeValueAsString(body);

                Request httpRequest = new Request.Builder()
                        .url(baseUrl + "/chat/completions")
                        .addHeader("Authorization", "Bearer " + apiKey)
                        .addHeader("Content-Type", "application/json")
                        .post(RequestBody.create(json, MediaType.parse("application/json")))
                        .build();

                try (Response response = client.newCall(httpRequest).execute()) {
                    if (!response.isSuccessful() || response.body() == null) {
                        emitter.send(SseEmitter.event()
                                .name("error")
                                .data("DeepSeek 请求失败: " + response.code()));
                        emitter.complete();
                        return;
                    }

                    BufferedReader reader = new BufferedReader(
                            new InputStreamReader(response.body().byteStream(), StandardCharsets.UTF_8)
                    );

                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.isBlank() || !line.startsWith("data:")) {
                            continue;
                        }

                        String data = line.substring(5).trim();
                        if ("[DONE]".equals(data)) {
                            emitter.send(SseEmitter.event().name("done").data("done"));
                            emitter.complete();
                            return;
                        }

                        JsonNode root = objectMapper.readTree(data);
                        JsonNode choices = root.path("choices");
                        if (!choices.isArray() || choices.isEmpty()) {
                            continue;
                        }

                        JsonNode delta = choices.get(0).path("delta");
                        if (delta.hasNonNull("reasoning_content")) {
                            emitter.send(SseEmitter.event()
                                    .name("reasoning")
                                    .data(delta.get("reasoning_content").asText()));
                        }

                        if (delta.hasNonNull("content")) {
                            emitter.send(SseEmitter.event()
                                    .name("content")
                                    .data(delta.get("content").asText()));
                        }
                    }

                    emitter.send(SseEmitter.event().name("done").data("done"));
                    emitter.complete();

                }
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                } catch (Exception ignored) {
                }
                emitter.completeWithError(e);
            }
        }).start();

        return emitter;
    }
}