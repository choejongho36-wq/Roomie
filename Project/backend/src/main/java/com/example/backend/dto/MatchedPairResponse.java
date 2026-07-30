package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MatchedPairResponse(
        Long id,
        String status,
        String region,
        Integer budgetMin,
        Integer budgetMax,
        LocalDate moveInDate,
        LocalDateTime createdAt,
        PartnerInfo me,
        PartnerInfo partner,
        ExternalLinks externalLinks
) {
    // 참고용: 각자 회원가입 때 저장해둔 희망지역 (매칭 페어의 공통조건과는 별개)
    public record PartnerInfo(Long userId, String nickname, String profileImageUrl, String region) {}

    // 공통조건(지역/예산) 기반으로 매번 새로 만들어지는 외부 검색 딥링크
    // (네이버부동산/다방/직방은 공식 검색 URL이 없어서 대신 이 3개로 안내함)
    public record ExternalLinks(String naverMapUrl, String naverSearchUrl, String googleSearchUrl) {}
}