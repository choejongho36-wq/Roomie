package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SurveyResultResponse(
        Long id,
        List<Integer> answers,
        Integer totalScore,
        LocalDateTime completedAt
) {}
