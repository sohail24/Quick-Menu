package com.quickmenu.service;

import com.quickmenu.config.DataInitializer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DemoDataService {

    private final DataInitializer dataInitializer;
    private final LockService lockService;

    private static final long DEMO_RESET_LOCK = 42624262L;

    @Transactional
    public void resetDemoData() {
        log.info("Attempting to acquire demo reset lock...");
        if (!lockService.tryAcquire(DEMO_RESET_LOCK)) {
            log.info("Another instance or thread is already seeding demo data. Skipping.");
            return;
        }

        try {
            log.info("Lock acquired. Starting demo data reset & seed process...");
            dataInitializer.resetDemoData();
            log.info("Demo data reset & seed completed successfully.");
        } finally {
            lockService.release(DEMO_RESET_LOCK);
        }
    }
}
