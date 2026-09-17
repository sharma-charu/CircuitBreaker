package com.axlero.recommendationservice.controller;

import com.axlero.recommendationservice.entity.Recommendation;
import com.axlero.recommendationservice.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService service;

    public RecommendationController(RecommendationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Recommendation> getRecommendations() {
        return service.getAllRecommendations();
    }

    @PostMapping
    public Recommendation addRecommendation(
            @RequestBody Recommendation recommendation) {
        return service.saveRecommendation(recommendation);
    }

    @GetMapping("/delay")
    public String delay() throws InterruptedException {
        return service.simulateDelay();
    }

    @GetMapping("/failure")
    public String failure() {
        return service.simulateFailure();
    }
}