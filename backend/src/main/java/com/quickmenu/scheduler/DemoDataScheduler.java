package com.quickmenu.scheduler;

import com.quickmenu.service.DemoDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class DemoDataScheduler {

    private final DemoDataService demoDataService;

    @Value("${demo.data.enabled:false}")
    private boolean demoDataEnabled;

    /**
     * Scheduled task to reset demo data.
     * - initialDelay: Wait 5 seconds after app is ready before first run.
     *   This ensures the application is fully started and responsive to health checks.
     * - fixedRate: Run every X minutes as configured.
     */
    @Scheduled(initialDelayString = "5000", fixedRateString = "#{${demo.data.restore-interval-minutes:30} * 60000}")
    public void restoreDemoData() {
        if (!demoDataEnabled) {
            log.info("Demo data restoration is disabled. Skipping.");
            return;
        }

        log.info("Starting scheduled demo data reset...");
        try {
            demoDataService.resetDemoData();
        } catch (Exception e) {
            log.error("Failed to restore demo data during scheduled task", e);
        }
    }
}
