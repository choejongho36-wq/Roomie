package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MatchedPairResponse(
        Long id,
        String status,
        String region,
        Integer depositMax,
        Integer monthlyRentMax,
        LocalDate moveInDate,
        LocalDateTime createdAt,
        PartnerInfo me,
        PartnerInfo partner,
        ExternalLinks externalLinks
) {
    // 참고용: 각자 회원가입 때 저장해둔 희망지역 (매칭 페어의 공통조건과는 별개)
    public record PartnerInfo(Long userId, String nickname, String profileImageUrl, String region) {}

    // 공통조건(지역/예산) 기반으로 매번 새로 만들어지는 외부 검색 딥링크
    public record ExternalLinks(String dabangMapUrl, String naverSearchUrl, String googleSearchUrl) {}
}