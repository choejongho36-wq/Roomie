package com.example.backend.dto;

import java.util.List;

public record SurveyComparisonResponse(
        Long userId,
        String nickname,
        Integer compatibilityScore,
        List<SurveyComparisonHighlightResponse> topReasons,
        List<SurveyComparisonHighlightResponse> differences,
        List<SurveyComparisonItemResponse> items
) {}
