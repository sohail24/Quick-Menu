package com.quickmenu.ai.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.LocalDate;

@Service
public class RateLimiterService {

    private final Map<String, UsageRecord> usageStore = new ConcurrentHashMap<>();
    private static final int DAILY_IMAGE_LIMIT = 5;

    public boolean canGenerateImage(String restaurantId) {
        String key = restaurantId + ":" + LocalDate.now();
        UsageRecord record = usageStore.computeIfAbsent(key, k -> new UsageRecord());
        return record.imageCount.get() < DAILY_IMAGE_LIMIT;
    }

    public void incrementImageCount(String restaurantId) {
        String key = restaurantId + ":" + LocalDate.now();
        usageStore.get(key).imageCount.incrementAndGet();
    }

    private static class UsageRecord {
        final AtomicInteger imageCount = new AtomicInteger(0);
    }
}
