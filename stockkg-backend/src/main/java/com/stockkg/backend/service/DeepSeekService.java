package com.stockkg.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockkg.backend.dto.ChatRequest;
import com.stockkg.backend.dto.StructuredAnswer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeepSeekService {

    @Value("${deepseek.api-key}")
    private String apiKey;

    @Value("${deepseek.base-url}")
    private String baseUrl;

    @Value("${deepseek.model}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public DeepSeekService(RestTemplateBuilder builder, ObjectMapper objectMapper) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(120))
                .build();
        this.objectMapper = objectMapper;
    }

    public StructuredAnswer chatJson(List<ChatRequest.Message> messages, Double temperature) {
        try {
            String url = baseUrl + "/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            List<Map<String, String>> msgList = new ArrayList<>();

            Map<String, String> system = new HashMap<>();
            system.put("role", "system");
            system.put("content",
                    "请只输出合法json，不要输出markdown，不要输出额外解释。" +
                            "必须返回如下结构：" +
                            "{\"title\":\"字符串\",\"intro\":\"字符串\",\"sections\":[]}"
            );
            msgList.add(system);

            if (messages != null) {
                msgList.addAll(
                        messages.stream()
                                .map(m -> {
                                    Map<String, String> map = new HashMap<>();
                                    map.put("role", m.getRole());
                                    map.put("content", m.getContent());
                                    return map;
                                })
                                .collect(Collectors.toList())
                );
            }

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", msgList);
            body.put("temperature", temperature == null ? 0.3 : temperature);
            body.put("stream", false);
            body.put("max_tokens", 800);

            Map<String, String> responseFormat = new HashMap<>();
            responseFormat.put("type", "json_object");
            body.put("response_format", responseFormat);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            Map responseBody = response.getBody();
            System.out.println("DeepSeek raw responseBody = " + responseBody);

            if (responseBody == null) {
                throw new RuntimeException("模型无返回内容");
            }

            List choices = (List) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("模型无返回结果");
            }

            Map firstChoice = (Map) choices.get(0);
            Map message = (Map) firstChoice.get("message");
            if (message == null) {
                throw new RuntimeException("模型返回格式异常：message 为空");
            }

            Object contentObj = message.get("content");
            String content = contentObj == null ? "" : contentObj.toString().trim();
            System.out.println("DeepSeek raw content = [" + content + "]");

            if (content.isEmpty()) {
                StructuredAnswer fallback = new StructuredAnswer();
                fallback.setTitle("回答为空");
                fallback.setIntro("模型本次返回了空内容，请重试一次。");
                fallback.setSections(new ArrayList<>());
                return fallback;
            }

            return objectMapper.readValue(content, StructuredAnswer.class);

        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON解析失败：" + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("DeepSeek JSON 调用失败：" + e.getMessage(), e);
        }
    }
}