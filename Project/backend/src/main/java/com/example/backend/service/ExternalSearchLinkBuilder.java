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

        double[] coordinate = DistrictCoordinates.findCoordinate(pair.getRegion());

        StringBuilder dabangUrl = new StringBuilder("https://www.dabangapp.com/map/onetwo?");
        // 보증금/월세 조건이 있으면 지도 좌표보다 먼저 붙여야 정상 반영됨 (실제 다방 공유링크 구조 기준)
        if (pair.getDepositMax() != null) {
            dabangUrl.append("depositRangeMax=").append(pair.getDepositMax()).append("&");
        }
        if (pair.getMonthlyRentMax() != null) {
            dabangUrl.append("priceRangeMax=").append(pair.getMonthlyRentMax()).append("&");
        }
        // 구 단위보다 한 단계 더 확대된 줌 (동네가 잘 보이는 수준)
        dabangUrl.append(String.format(java.util.Locale.US, "m_lat=%s&m_lng=%s&m_zoom=15", coordinate[0], coordinate[1]));

        String naverSearchUrl = "https://search.naver.com/search.naver?query=" + encoded;
        String googleSearchUrl = "https://www.google.com/search?q=" + encoded;

        return new MatchedPairResponse.ExternalLinks(dabangUrl.toString(), naverSearchUrl, googleSearchUrl);
    }

    private static String buildQuery(MatchedPair pair) {
        StringBuilder sb = new StringBuilder();

        String region = pair.getRegion();
        sb.append((region != null && !region.isBlank()) ? region : "서울");

        sb.append(" 원룸 투룸 매물");

        if (pair.getDepositMax() != null) {
            sb.append(" 보증금 ").append(pair.getDepositMax()).append("만원 이하");
        }
        if (pair.getMonthlyRentMax() != null) {
            sb.append(" 월세 ").append(pair.getMonthlyRentMax()).append("만원 이하");
        }

        return sb.toString();
    }
}