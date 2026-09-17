package com.axlero.api_Gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.reactive.server.WebTestClient;

class FallbackControllerTest {

    private WebTestClient webTestClient;

    @BeforeEach
    void setUp() {
        webTestClient = WebTestClient.bindToController(new FallbackController()).build();
    }

    @Test
    void testRecommendationsFallback() {
        webTestClient.get()
                .uri("/fallback/recommendations")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("fallback")
                .jsonPath("$.message").isNotEmpty()
                .jsonPath("$.recommendations").isArray();
    }

    @Test
    void testProductsFallback() {
        webTestClient.get()
                .uri("/fallback/products")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("fallback")
                .jsonPath("$.products").isArray();
    }

    @Test
    void testInventoryFallback() {
        webTestClient.get()
                .uri("/fallback/inventory")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").isEqualTo("fallback")
                .jsonPath("$.available").isEqualTo(false);
    }
}
