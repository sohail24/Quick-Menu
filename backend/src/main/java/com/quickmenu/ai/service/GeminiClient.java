package com.quickmenu.ai.service;

import com.quickmenu.ai.dto.GeminiRequest;
import com.quickmenu.ai.dto.GeminiResponse;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
@Slf4j
public class GeminiClient {

    private final RestClient restClient;
    
    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    // Using URI variables for safer character handling
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}";

    public GeminiClient(RestClient restClient) {
        this.restClient = restClient;
    }

    @Retry(name = "aiService", fallbackMethod = "fallbackGenerateContent")
    public String generateContent(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            log.warn("Gemini API Key is missing.");
            return "AI feature disabled: GEMINI_API_KEY is missing in your .env file.";
        }

        try {
            GeminiRequest request = GeminiRequest.builder()
                    .contents(List.of(GeminiRequest.Content.builder()
                            .parts(List.of(GeminiRequest.Part.builder()
                                    .text(prompt)
                                    .build()))
                            .build()))
                    .build();

            // Explicitly using gemini-1.5-flash
            return restClient.post()
                    .uri(GEMINI_API_URL, "gemini-1.5-flash", geminiApiKey)
                    .body(request)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(), (req, res) -> {
                        // Extract more detail if possible
                        throw new RuntimeException("Gemini API Error [" + res.getStatusCode() + "]: " + res.getStatusText());
                    })
                    .body(GeminiResponse.class)
                    .getFirstText();

        } catch (Exception e) {
            log.error("Gemini API Error: {}", e.getMessage());
            throw e; 
        }
    }

    public String fallbackGenerateContent(String prompt, Throwable t) {
        log.error("AI Service fallback triggered: {}", t.getMessage());
        return "AI Error Details: " + t.getMessage();
    }
}
