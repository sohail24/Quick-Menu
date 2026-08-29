package com.quickmenu.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API Gateway Microservice
 *
 * The API Gateway is the SINGLE ENTRY POINT for all client traffic.
 * It implements the "Gateway Pattern" from microservices architecture.
 *
 * Responsibilities:
 *  1. ROUTING   — directs requests to the correct downstream service
 *  2. AUTH      — validates JWT on every secured request (cross-cutting concern)
 *  3. SECURITY  — checks Redis JWT blacklist (handles logout invalidation)
 *
 * Why Gateway matters (Interview):
 *  "Without a gateway, clients would need to know every service's URL and port.
 *   The gateway acts as a facade — clients only know one endpoint.
 *   Cross-cutting concerns (auth, rate limiting, CORS) are handled once here,
 *   not duplicated in every service."
 *
 * Uses Spring WebFlux (reactive) for high-throughput non-blocking I/O.
 */
@SpringBootApplication
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
