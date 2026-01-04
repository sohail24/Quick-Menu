package com.quickmenu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
@RequiredArgsConstructor
public class LockService {

    private final JdbcTemplate jdbcTemplate;

    // In-memory lock for H2 and single-instance environments
    private final AtomicBoolean inMemoryLock = new AtomicBoolean(false);

    /**
     * Tries to acquire a lock for the given ID.
     * On PostgreSQL, this uses advisory locks.
     * On other databases (like H2), this uses an AtomicBoolean as a fallback.
     */
    public boolean tryAcquire(long lockId) {
        if (isPostgres()) {
            try {
                log.debug("Attempting to acquire Postgres advisory lock (id={})...", lockId);
                Boolean acquired = jdbcTemplate.queryForObject(
                        "SELECT pg_try_advisory_lock(?)",
                        Boolean.class,
                        lockId
                );
                return Boolean.TRUE.equals(acquired);
            } catch (Exception e) {
                log.error("Error acquiring Postgres advisory lock", e);
                return false;
            }
        } else {
            // Fallback for H2: use AtomicBoolean
            boolean acquired = inMemoryLock.compareAndSet(false, true);
            log.debug("In-memory lock acquire attempt: {}", acquired);
            return acquired;
        }
    }

    /**
     * Releases a lock for the given ID.
     */
    public void release(long lockId) {
        if (isPostgres()) {
            try {
                log.debug("Releasing Postgres advisory lock (id={})...", lockId);
                jdbcTemplate.execute("SELECT pg_advisory_unlock(" + lockId + ")");
            } catch (Exception e) {
                log.warn("Error releasing Postgres advisory lock (id={}): {}", lockId, e.getMessage());
            }
        } else {
            // Fallback for H2
            inMemoryLock.set(false);
            log.debug("In-memory lock released.");
        }
    }

    private boolean isPostgres() {
        try (java.sql.Connection conn = Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
            return conn.getMetaData().getDatabaseProductName().equalsIgnoreCase("PostgreSQL");
        } catch (Exception e) {
            return false;
        }
    }
}
