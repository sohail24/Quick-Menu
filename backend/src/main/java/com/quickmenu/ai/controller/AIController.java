package com.quickmenu.ai.controller;

import com.quickmenu.ai.service.AIService;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final com.quickmenu.ai.service.RateLimiterService rateLimiterService;

    @GetMapping("/dish-description")
    @RateLimiter(name = "aiApi")
    public ResponseEntity<Map<String, String>> getDishDescription(
            @RequestParam String dishName, 
            @RequestParam String category) {
        String description = aiService.generateDishDescription(dishName, category);
        return ResponseEntity.ok(Map.of("description", description));
    }

    @PostMapping("/admin-insights")
    @RateLimiter(name = "aiApi")
    public ResponseEntity<Map<String, String>> getAdminInsights(
            @RequestBody Map<String, String> request) {
        String restaurantName = request.getOrDefault("restaurantName", "the restaurant");
        String analyticsData = request.getOrDefault("analyticsData", "");
        com.quickmenu.ai.dto.AIContentResponse response = aiService.generateAdminInsights(restaurantName, analyticsData);
        return ResponseEntity.ok(Map.of(
            "insights", response.getContent(),
            "modelName", response.getModelName()
        ));
    }

    @GetMapping("/generate-image")
    public ResponseEntity<Map<String, String>> generateImage(@RequestParam String dishName, @RequestParam String restaurantId) {
        if (!rateLimiterService.canGenerateImage(restaurantId)) {
            return ResponseEntity.status(429).body(Map.of("error", "Daily AI image limit reached for this restaurant."));
        }
        
        String imageUrl = aiService.generateImagePath(dishName);
        rateLimiterService.incrementImageCount(restaurantId);
        
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
}
