package com.example.backend.dto;

import java.util.List;

public record RecommendationResponse(
        Long userId,
        String nickname,
        String profileImageUrl,
        String bio,
        List<String> tags,
        Integer compatibilityScore,
        Integer age
) {}
