package com.quickmenu.ai.service;

import com.quickmenu.ai.dto.GeminiRequest;
import com.quickmenu.ai.dto.GeminiResponse;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class AIService {

    private final RestClient restClient;
    
    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    public AIService(RestClient restClient) {
        this.restClient = restClient;
    }

    @Retry(name = "aiService", fallbackMethod = "fallbackGenerateContent")
    @TimeLimiter(name = "aiService")
    public String generateContent(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            log.warn("Gemini API Key is missing. Returning fallback response.");
            return "AI feature is currently disabled (API key missing).";
        }

        try {
            GeminiRequest request = GeminiRequest.builder()
                    .contents(List.of(GeminiRequest.Content.builder()
                            .parts(List.of(GeminiRequest.Part.builder()
                                    .text(prompt)
                                    .build()))
                            .build()))
                    .build();

            GeminiResponse response = restClient.post()
                    .uri(GEMINI_API_URL + geminiApiKey)
                    .body(request)
                    .retrieve()
                    .body(GeminiResponse.class);

            if (response != null) {
                return response.getFirstText();
            }
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            throw e; // Rethrow to trigger retry/timelimiter
        }
        return "Sorry, I couldn't process that request right now.";
    }

    // Fallback method for generateContent
    public String fallbackGenerateContent(String prompt, Throwable t) {
        log.error("AI Service fallback triggered due to: " + t.getMessage());
        return "I'm having trouble connecting to my AI brain right now. Please try again later!";
    }

    public String generateDishDescription(String dishName, String category) {
        String prompt = String.format("Write a short, appetizing 2 sentence description for a dish named '%s' in the category '%s'. Keep it concise for a restaurant menu.", 
                dishName, category);
        return generateContent(prompt);
    }

    public String generateAdminInsights(String restaurantName, String analyticsData) {
        String prompt = String.format("As an AI restaurant consultant, analyze the following performance data for '%s' and provide 3 actionable bullet points for improvement: %s", 
                restaurantName, analyticsData);
        return generateContent(prompt);
    }
    
    public String generateImagePath(String dishName) {
        // Using Pollinations.ai for simple free image generation
        // Format: https://image.pollinations.ai/prompt/{prompt}?width=1024&height=1024&nologo=true
        String encodedDish = dishName.replace(" ", "%20");
        return String.format("https://image.pollinations.ai/prompt/delicious%%20%s%%20professional%%20food%%20photography%%20high%%20resolution?width=800&height=600&nologo=true", encodedDish);
    }
}
