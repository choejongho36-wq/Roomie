package com.example.backend.dto;

import java.util.List;

public record RecommendationResponse(
        Long userId,
        String nickname,
        String profileImageUrl,
        String bio,
        List<String> tags,
        Integer compatibilityScore,
        Integer age,
        String job,
        String region,
        Boolean emailVerified,
        // 설문 19번 "희망 월세" 응답이 가리키는 구간(만원). 예) "70~100만 원" 응답이면
        // (70, 100). 전세·년세(응답 1번)를 선택했거나 응답이 없으면 둘 다 null(필터에서 제외).
        Integer desiredRentMin,
        Integer desiredRentMax
) {}
