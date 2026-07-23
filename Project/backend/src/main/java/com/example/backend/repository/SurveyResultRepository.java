package com.example.backend.repository;

import com.example.backend.domain.SurveyResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurveyResultRepository extends JpaRepository<SurveyResult, Long> {
    List<SurveyResult> findByUserIdOrderByCompletedAtDesc(Long userId);
}
