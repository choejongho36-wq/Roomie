package com.example.backend.dto;

public record SurveyComparisonHighlightResponse(
        String category,
        String myAnswer,
        String otherAnswer,
        Integer difference,
        String description
) {}
