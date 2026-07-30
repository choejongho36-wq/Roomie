package com.example.backend.service;

import com.example.backend.domain.MatchedPair;

import java.util.Locale;

// 다방은 좌표(m_lat/m_lng) + 보증금/월세 필터(depositRangeMax/priceRangeMax)를
// URL 파라미터로 그대로 받아주는 공유링크 형식을 지원해서, 이 하나만 만들어줌
// (네이버부동산/직방은 공식 검색 URL이 없어서 제외, 네이버/구글 일반검색은 매물이 잘 안 뜨는 걸 확인해서 제외)
public class ExternalSearchLinkBuilder {

    private ExternalSearchLinkBuilder() {
    }

    public static String build(MatchedPair pair) {
        double[] coordinate = DistrictCoordinates.findCoordinate(pair.getRegion());

        StringBuilder dabangUrl = new StringBuilder("https://www.dabangapp.com/map/onetwo?");
        // 보증금/월세 조건이 있으면 지도 좌표보다 먼저 붙여야 정상 반영됨 (실제 다방 공유링크 구조 기준)
        if (pair.getDepositMax() != null) {
            dabangUrl.append("depositRangeMax=").append(pair.getDepositMax()).append("&");
        }
        if (pair.getMonthlyRentMax() != null) {
            dabangUrl.append("priceRangeMax=").append(pair.getMonthlyRentMax()).append("&");
        }
        // 동네가 잘 보이는 확대 수준
        dabangUrl.append(String.format(Locale.US, "m_lat=%s&m_lng=%s&m_zoom=15", coordinate[0], coordinate[1]));

        return dabangUrl.toString();
    }
}