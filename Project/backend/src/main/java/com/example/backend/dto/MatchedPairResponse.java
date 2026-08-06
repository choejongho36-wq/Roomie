package com.example.backend.dto;

import java.time.LocalDateTime;

public record MatchedPairResponse(
        Long id,
        String status,
        String region,
        Integer depositMax,
        Integer monthlyRentMax,
        LocalDateTime createdAt,
        PartnerInfo me,
        PartnerInfo partner,
        String dabangMapUrl,
        Boolean myConfirmed,
        Boolean partnerConfirmed
) {
    // 참고용: 각자 회원가입 때 저장해둔 희망지역 (매칭 페어의 공통조건과는 별개)
    public record PartnerInfo(Long userId, String nickname, String profileImageUrl, String region) {}
}