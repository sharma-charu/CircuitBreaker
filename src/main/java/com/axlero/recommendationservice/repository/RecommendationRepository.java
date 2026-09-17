package com.axlero.recommendationservice.repository;

import com.axlero.recommendationservice.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
}