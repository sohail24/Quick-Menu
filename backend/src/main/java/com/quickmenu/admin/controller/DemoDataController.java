package com.quickmenu.admin.controller;

import com.quickmenu.scheduler.DemoDataScheduler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/restore-demo-data")
@Tag(name = "Admin", description = "Admin operations")
public class DemoDataController {

    private final DemoDataScheduler demoDataScheduler;

    public DemoDataController(DemoDataScheduler demoDataScheduler) {
        this.demoDataScheduler = demoDataScheduler;
    }

    @PostMapping
    @Operation(summary = "Restore demo data", description = "Manually trigger restoration of soft-deleted demo data.")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> restoreDemoData() {
        demoDataScheduler.restoreDemoData();
        return ResponseEntity.ok("Demo data restoration triggered successfully.");
    }
}
