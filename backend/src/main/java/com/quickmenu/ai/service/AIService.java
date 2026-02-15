package com.quickmenu.ai.service;

import com.quickmenu.ai.dto.AIContentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@Slf4j
public class AIService {

    private final RestClient restClient;
    private final com.quickmenu.uploads.CloudinaryService cloudinaryService;

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.huggingface.token:}")
    private String huggingFaceToken;

    public AIService(RestClient restClient, com.quickmenu.uploads.CloudinaryService cloudinaryService) {
        this.restClient = restClient;
        this.cloudinaryService = cloudinaryService;
    }

    /**
     * Highly efficient "Flash" models prioritized for Free Tier limits.
     * These models have the highest Rate Limits and zero cost on Google AI Studio.
     */
    private static final List<String> FLASH_MODELS = List.of(
        "gemini-2.0-flash", 
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-flash-lite-latest"
    );

    public AIContentResponse generateContent(String prompt) {
        StringBuilder rca = new StringBuilder();
        
        // Tier 1: Gemini (Primary - 1,500 req/day)
        String rawKey = geminiApiKey != null ? geminiApiKey.trim() : "";
        String cleanKey = rawKey.replaceAll("^\"|\"$", "");
        if (!cleanKey.isEmpty()) {
            for (String modelName : FLASH_MODELS) {
                try {
                    log.info("AI: Attempting Gemini model: {}", modelName);
                    String result = tryGemini(prompt, "v1beta", modelName, cleanKey);
                    return new AIContentResponse(result, "Google Gemini (" + modelName + ")");
                } catch (Exception e) {
                    log.warn("AI: Gemini {} failed: {}", modelName, e.getMessage());
                    rca.append("[G:").append(modelName).append("] ");
                }
            }
        }

        // Tier 2: Hugging Face (Secondary - Professional Free Choice)
        try {
            log.info("AI: Attempting Hugging Face Text (Mistral-7B)...");
            String result = tryHuggingFaceText(prompt);
            if (result != null) return new AIContentResponse(result, "Hugging Face (Mistral-7B)");
        } catch (Exception e) {
            log.warn("AI: Hugging Face Text failed: {}", e.getMessage());
            rca.append("[HF] ");
        }

        // Tier 3: MLVoca (Cloud Fallback - Keyless & Free)
        try {
            log.info("AI: Falling back to MLVoca (TinyLlama Cloud)...");
            String result = tryMLVoca(prompt);
            if (result != null) return new AIContentResponse(result, "MLVoca Cloud (TinyLlama)");
        } catch (Exception e) {
            log.warn("AI: MLVoca failed: {}", e.getMessage());
            rca.append("[MLVoca] ");
        }

        return new AIContentResponse("AI Currently Unavailable. Fallbacks exhausted: " + rca.toString(), "None (All Failed)");
    }

    private String tryHuggingFaceText(String prompt) {
        String token = huggingFaceToken != null ? huggingFaceToken.trim() : "";
        if (token.isEmpty()) return null;

        try {
            // Using a high-quality instruction model
            String model = "mistralai/Mistral-7B-Instruct-v0.1";
            String url = "https://router.huggingface.co/hf-inference/models/" + model;

            com.fasterxml.jackson.databind.JsonNode response = restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .body(java.util.Map.of("inputs", prompt))
                    .retrieve()
                    .body(com.fasterxml.jackson.databind.JsonNode.class);

            if (response != null && response.isArray()) {
                return response.get(0).get("generated_text").asText();
            }
        } catch (Exception e) {
            log.warn("Hugging Face Text failed: {}", e.getMessage());
        }
        return null;
    }

    private String tryMLVoca(String prompt) {
        try {
            java.util.Map<String, Object> request = java.util.Map.of(
                "model", "tinyllama",
                "prompt", prompt,
                "stream", false
            );

            // MLVoca provides a cloud-hosted Ollama-compatible endpoint
            return restClient.post()
                    .uri("https://mlvoca.com/api/generate")
                    .body(request)
                    .retrieve()
                    .body(com.fasterxml.jackson.databind.JsonNode.class)
                    .get("response").asText();
        } catch (Exception e) {
            log.warn("MLVoca Cloud failed: {}", e.getMessage());
        }
        return null;
    }

    private String tryGemini(String prompt, String version, String model, String key) {
        String urlString = String.format("https://generativelanguage.googleapis.com/%s/models/%s:generateContent?key=%s", 
                version, model, key);
        
        java.net.URI uri = java.net.URI.create(urlString);

        com.quickmenu.ai.dto.GeminiRequest request = com.quickmenu.ai.dto.GeminiRequest.builder()
                .contents(List.of(com.quickmenu.ai.dto.GeminiRequest.Content.builder()
                        .parts(List.of(com.quickmenu.ai.dto.GeminiRequest.Part.builder()
                                .text(prompt)
                                .build()))
                        .build()))
                .build();

        return restClient.post()
                .uri(uri)
                .body(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(), (req, res) -> {
                    throw new RuntimeException("API error " + res.getStatusCode());
                })
                .body(com.quickmenu.ai.dto.GeminiResponse.class)
                .getFirstText();
    }


    public String generateDishDescription(String dishName, String category) {
        String prompt = String.format("Write a short, appetizing 2 sentence description for a dish named '%s' in the category '%s'. Keep it concise for a restaurant menu.", 
                dishName, category);
        return generateContent(prompt).getContent();
    }

    public AIContentResponse generateAdminInsights(String restaurantName, String analyticsData) {
        String prompt = String.format("As an AI restaurant consultant, analyze the following performance data for '%s' and provide 3 actionable bullet points for improvement: %s", 
                restaurantName, analyticsData);
        return generateContent(prompt);
    }
    
    /**
     * AI Image Generation (Triple-Tier Resiliency)
     * Priority: Google Imagen 4.0 -> Hugging Face FLUX.1 -> Professional Photography.
     * All AI-generated images are mirrored to Cloudinary for permanent hosting.
     */
    public String generateImagePath(String dishName) {
        // Mode Toggle: Set to 'true' to force Professional Photography if AI is unstable
        boolean forceStablePhotography = false; 

        if (forceStablePhotography) {
            return getStablePhotographyUrl(dishName);
        }

        // Tier 1: Google Imagen (Primary - 1,500 req/day)
        String geminiImage = tryGeminiImagen(dishName);
        if (geminiImage != null) return geminiImage;

        // Tier 2: Hugging Face (Secondary - Professional Fallback)
        String hfResult = tryHuggingFace(dishName);
        if (hfResult != null) return hfResult;

        log.warn("All AI Image Engines Failed: Falling back to Professional Photography.");
        return getStablePhotographyUrl(dishName);
    }

    private String tryGeminiImagen(String dishName) {
        String key = geminiApiKey != null ? geminiApiKey.trim() : "";
        if (key.isEmpty()) return null;

        // List of potential Gemini Image models (Google updates these frequently)
        List<String> imagenModels = List.of(
            "imagen-4.0-generate-001",
            "imagen-4.0-fast-generate-001",
            "imagen-4.0-ultra-generate-001",
            "imagen-3.0-generate-001"
        );

        String prompt = String.format("Professional gourmet restaurant food photography of %s, cinematic lighting, 8k, black background, top view of food, it should look like food photography for online food portal", dishName);

        for (String modelName : imagenModels) {
            try {
                log.info("AI: Attempting image generation via Google Imagen model: {}", modelName);
                
                // Note: Imagen 4 and latest 3.x models use ':predict' instead of ':generateImages'
                String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:predict?key=%s", modelName, key);

                // Google Imagen Request Structure (Vertex-mirror style)
                java.util.Map<String, Object> request = java.util.Map.of(
                    "instances", java.util.List.of(java.util.Map.of("prompt", prompt)),
                    "parameters", java.util.Map.of("sampleCount", 1)
                );

                com.fasterxml.jackson.databind.JsonNode response = restClient.post()
                        .uri(url)
                        .body(request)
                        .retrieve()
                        .onStatus(status -> status.value() == 404, (req, res) -> {
                            throw new RuntimeException("Model not found (404)");
                        })
                        .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(), (req, res) -> {
                            log.error("Gemini Imagen {} Error: {}", modelName, res.getStatusCode());
                            throw new RuntimeException("Imagen fail");
                        })
                        .body(com.fasterxml.jackson.databind.JsonNode.class);

                if (response != null && response.has("predictions")) {
                    com.fasterxml.jackson.databind.JsonNode prediction = response.get("predictions").get(0);
                    if (prediction != null && prediction.has("bytesBase64Encoded")) {
                        String base64 = prediction.get("bytesBase64Encoded").asText();
                        byte[] imageBytes = java.util.Base64.getDecoder().decode(base64);
                        
                        log.info("AI: SUCCESS using Google Imagen model: {}. Uploading to Cloudinary...", modelName);
                        return cloudinaryService.uploadBytes(imageBytes);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini Imagen model {} unavailable or failed: {}", modelName, e.getMessage());
                // Continue to next model if it's a 404 or other failure
            }
        }
        return null;
    }

    private String tryHuggingFace(String dishName) {
        String token = huggingFaceToken != null ? huggingFaceToken.trim() : "";
        if (token.isEmpty()) {
            log.warn("Hugging Face token not configured. Skipping HF image generation.");
            return null;
        }

        // List of robust models that are usually active on the Free Inference API
        List<String> hfModels = List.of(
            "black-forest-labs/FLUX.1-schnell",              // State of the Art (Top choice)
            "stabilityai/stable-diffusion-xl-base-1.0",      // High Res Fallback
            "stabilityai/stable-diffusion-2-1"               // Legacy Robustness
        );

        String prompt = String.format("Professional gourmet restaurant food photography of %s, cinematic lighting, 8k, black background, top view of food, it should look like food photography for online food portal", dishName);

        for (String modelName : hfModels) {
            try {
                log.info("AI: Attempting image generation via Hugging Face model: {}", modelName);
                // New Hugging Face Inference Endpoint (as of 2026 deprecation)
                String modelUrl = "https://router.huggingface.co/hf-inference/models/" + modelName;
                
                byte[] imageBytes = restClient.post()
                        .uri(modelUrl)
                        .header("Authorization", "Bearer " + token)
                        .body(java.util.Map.of("inputs", prompt))
                        .retrieve()
                        .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(), (req, res) -> {
                            log.error("Hugging Face model {} failed with status: {}", modelName, res.getStatusCode());
                            throw new RuntimeException("Model fail (" + res.getStatusCode() + ")");
                        })
                        .body(byte[].class);

                if (imageBytes != null && imageBytes.length > 0) {
                    log.info("AI: SUCCESS using Hugging Face model: {}. Uploading to Cloudinary...", modelName);
                    return cloudinaryService.uploadBytes(imageBytes);
                }
            } catch (Exception e) {
                log.warn("Hugging Face model {} unavailable or failed: {}", modelName, e.getMessage());
                // Continue to next model
            }
        }
        return null;
    }

    private String getStablePhotographyUrl(String dishName) {
        // High-quality curated photography fallback (Zero-key required)
        String cleanDish = dishName.replace(" ", ",");
        return String.format("https://loremflickr.com/800/600/food,gourmet,plated,%s/all", cleanDish);
    }
}
