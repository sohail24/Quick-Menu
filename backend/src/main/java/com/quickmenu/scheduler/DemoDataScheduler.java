package com.quickmenu.scheduler;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class DemoDataScheduler {

    @PersistenceContext
    private EntityManager entityManager;

    private final PasswordEncoder passwordEncoder;

    @Value("${demo.data.enabled:false}")
    private boolean demoDataEnabled;

    // Run every 30 minutes (1800000 ms), initial delay 5 minutes
    // We'll primarily use the fixedDelayString to read from properties if possible,
    // but the annotation requires a constant or property placeholder.
    // Since we want it configurable, we'll strive for that.
    @Scheduled(fixedRateString = "#{${demo.data.restore-interval-minutes:30} * 60000}")
    @Transactional
    public void restoreDemoData() {
        if (!demoDataEnabled) {
            return;
        }

        log.info("Starting scheduled demo data restoration...");

        try {
            // Restore entities
            restoreEntity("users");
            restoreEntity("restaurants");
            restoreEntity("dishes");
            restoreEntity("categories");
            restoreEntity("restaurant_tables");
            restoreEntity("orders");

            // Reset passwords for demo users
            resetDemoUserPasswords();

            log.info("Demo data restoration completed successfully.");
        } catch (Exception e) {
            log.error("Failed to restore demo data", e);
        }
    }

    private void restoreEntity(String tableName) {
        int updatedCount = entityManager.createNativeQuery(
                "UPDATE " + tableName + " SET deleted_at = NULL WHERE is_demo = true AND deleted_at IS NOT NULL")
                .executeUpdate();
        if (updatedCount > 0) {
            log.info("Restored {} records in {}", updatedCount, tableName);
        }
    }

    private void resetDemoUserPasswords() {
        String adminPassword = passwordEncoder.encode("Admin123!");
        String staffPassword = passwordEncoder.encode("Staff123!");

        int adminReset = entityManager.createNativeQuery(
                "UPDATE users SET password_hash = :pwd WHERE email = 'admin@quickmenu.local' AND is_demo = true")
                .setParameter("pwd", adminPassword)
                .executeUpdate();

        int staffReset = entityManager.createNativeQuery(
                "UPDATE users SET password_hash = :pwd WHERE email = 'staff@quickmenu.local' AND is_demo = true")
                .setParameter("pwd", staffPassword)
                .executeUpdate();
                
        if (adminReset > 0 || staffReset > 0) {
            log.info("Reset demo user passwords (Admin: {}, Staff: {})", adminReset > 0, staffReset > 0);
        }
    }
}
