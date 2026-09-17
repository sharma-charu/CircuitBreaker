package com.axlero.recommendationservice.service;

import com.axlero.recommendationservice.entity.Recommendation;
import com.axlero.recommendationservice.repository.RecommendationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecommendationService {

    private final RecommendationRepository repository;

    public RecommendationService(RecommendationRepository repository) {
        this.repository = repository;
    }

    public List<Recommendation> getAllRecommendations() {
        return repository.findAll();
    }

    public Recommendation saveRecommendation(Recommendation recommendation) {
        return repository.save(recommendation);
    }

    public String simulateDelay() throws InterruptedException {
        Thread.sleep(10000);
        return "Recommendation service is back after delay";
    }

    public String simulateFailure() {
        throw new RuntimeException("Recommendation service is temporarily unavailable");
    }
}