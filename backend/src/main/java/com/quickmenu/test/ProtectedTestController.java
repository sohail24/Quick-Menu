package com.quickmenu.test;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProtectedTestController {

    @GetMapping("/api/protected/ping")
    public String protectedPing() {
        return "pong-authenticated";
    }
}
