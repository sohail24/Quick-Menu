package com.quickmenu.scheduler;

import com.quickmenu.config.DataInitializer;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class DemoDataScheduler {

    private final DataInitializer dataInitializer;

    @Value("${demo.data.enabled:false}")
    private boolean demoDataEnabled;

    @Scheduled(fixedRateString = "#{${demo.data.restore-interval-minutes:30} * 60000}")
    @Transactional
    public void restoreDemoData() {
        if (!demoDataEnabled) {
            return;
        }

        log.info("Starting scheduled demo data restoration (Truncate & Re-seed)...");
        try {
            dataInitializer.resetDemoData();
            log.info("Demo data restoration completed successfully.");
        } catch (Exception e) {
            log.error("Failed to restore demo data", e);
        }
    }
}
