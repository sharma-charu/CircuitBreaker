package com.axlero.inventory_service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller dedicated to controlled latency and failure simulations
 * for testing API Gateway Circuit Breaker and Time Limiter resilience
 * mechanisms.
 */
@RestController
@RequestMapping("/inventory/simulate")
public class InventorySimulationController {

    private static final int MAX_DELAY_MS = 30000;

    @GetMapping("/delay")
    public ResponseEntity<Map<String, Object>> simulateDelay(
            @RequestParam(defaultValue = "3000") int durationMs) {
        int safeDelay = Math.min(Math.max(durationMs, 0), MAX_DELAY_MS);
        try {
            Thread.sleep(safeDelay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delay interrupted"));
        }

        return ResponseEntity.ok(Map.of(
                "status", "delayed_response",
                "delayedMs", safeDelay,
                "message", "Simulated latency of " + safeDelay + "ms completed successfully."));
    }

    @GetMapping("/fault")
    public ResponseEntity<Map<String, Object>> simulateFault(
            @RequestParam(defaultValue = "500") int statusCode) {
        HttpStatus status = HttpStatus.resolve(statusCode);
        if (status == null || !status.isError()) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(status).body(Map.of(
                "status", "simulated_error",
                "statusCode", status.value(),
                "message", "Simulated service fault to test Circuit Breaker trip threshold."));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> simulationStatus() {
        return ResponseEntity.ok(Map.of(
                "service", "inventory-service",
                "simulationEnabled", true,
                "endpoints", Map.of(
                        "delay", "/inventory/simulate/delay?durationMs=3000",
                        "fault", "/inventory/simulate/fault?statusCode=500")));
    }
}
