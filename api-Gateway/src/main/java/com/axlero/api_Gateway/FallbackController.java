package com.axlero.api_Gateway;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import java.util.Map;

@RestController
public class FallbackController {

    @GetMapping("/fallback/recommendations")
    public Mono<Map<String, Object>> recommendationsFallback() {
        return Mono.just(Map.of(
                "status", "fallback",
                "message", "Recommendation service is currently unavailable. Showing default results.",
                "recommendations", java.util.List.of()));
    }

    @GetMapping("/fallback/products")
    public Mono<Map<String, Object>> productsFallback() {
        return Mono.just(Map.of(
                "status", "fallback",
                "message", "Product service is temporarily unavailable. Please try again later.",
                "products", java.util.List.of()));
    }

    @GetMapping("/fallback/inventory")
    public Mono<Map<String, Object>> inventoryFallback() {
        return Mono.just(Map.of(
                "status", "fallback",
                "message", "Inventory service is temporarily unavailable. Please try again later.",
                "available", false));
    }
}
