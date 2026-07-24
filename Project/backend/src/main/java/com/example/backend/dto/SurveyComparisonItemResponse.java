package com.example.backend.dto;

public record SurveyComparisonItemResponse(
        Integer questionId,
        String category,
        String myAnswer,
        String otherAnswer,
        Integer myScore,
        Integer otherScore,
        Integer difference,
        String matchLevel
) {}
