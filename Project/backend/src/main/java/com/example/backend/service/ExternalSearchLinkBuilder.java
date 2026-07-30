package com.example.backend.service;

import com.example.backend.domain.MatchedPair;
import com.example.backend.dto.MatchedPairResponse;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

// 네이버부동산/다방/직방은 공식 검색 URL이 없어서(내부 지역코드 기반 SPA),
// 대신 확실히 동작하는 "네이버지도 검색"과 "일반 웹검색"으로 안내함
public class ExternalSearchLinkBuilder {

    private ExternalSearchLinkBuilder() {
    }

    public static MatchedPairResponse.ExternalLinks build(MatchedPair pair) {
        String query = buildQuery(pair);
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);

        String naverMapUrl = "https://map.naver.com/p/search/" + encoded;
        String naverSearchUrl = "https://search.naver.com/search.naver?query=" + encoded;
        String googleSearchUrl = "https://www.google.com/search?q=" + encoded;

        return new MatchedPairResponse.ExternalLinks(naverMapUrl, naverSearchUrl, googleSearchUrl);
    }

    private static String buildQuery(MatchedPair pair) {
        StringBuilder sb = new StringBuilder();

        String region = pair.getRegion();
        sb.append((region != null && !region.isBlank()) ? region : "서울");

        sb.append(" 원룸 투룸 매물");

        if (pair.getBudgetMin() != null && pair.getBudgetMax() != null) {
            sb.append(" ").append(pair.getBudgetMin()).append("~").append(pair.getBudgetMax()).append("만원");
        } else if (pair.getBudgetMax() != null) {
            sb.append(" ").append(pair.getBudgetMax()).append("만원 이하");
        }

        return sb.toString();
    }
}