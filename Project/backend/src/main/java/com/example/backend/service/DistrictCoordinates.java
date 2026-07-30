package com.example.backend.service;

import java.util.Map;

// 서울 25개 구의 대략적인 중심 좌표 (다방 지도 딥링크의 지도 중심점으로 사용)
// 동 단위까지는 아니고 구 단위 정확도지만, 지도를 열어서 그 동네를 보여주는 용도로는 충분함
public final class DistrictCoordinates {

    private DistrictCoordinates() {
    }

    public static final double SEOUL_CITY_HALL_LAT = 37.5665;
    public static final double SEOUL_CITY_HALL_LNG = 126.9780;

    private static final Map<String, double[]> COORDINATES = Map.ofEntries(
            Map.entry("강남구", new double[]{37.5172, 127.0473}),
            Map.entry("강동구", new double[]{37.5301, 127.1238}),
            Map.entry("강북구", new double[]{37.6396, 127.0257}),
            Map.entry("강서구", new double[]{37.5509, 126.8495}),
            Map.entry("관악구", new double[]{37.4784, 126.9516}),
            Map.entry("광진구", new double[]{37.5384, 127.0822}),
            Map.entry("구로구", new double[]{37.4954, 126.8874}),
            Map.entry("금천구", new double[]{37.4569, 126.8956}),
            Map.entry("노원구", new double[]{37.6542, 127.0568}),
            Map.entry("도봉구", new double[]{37.6688, 127.0471}),
            Map.entry("동대문구", new double[]{37.5744, 127.0396}),
            Map.entry("동작구", new double[]{37.5124, 126.9393}),
            Map.entry("마포구", new double[]{37.5663, 126.9019}),
            Map.entry("서대문구", new double[]{37.5791, 126.9368}),
            Map.entry("서초구", new double[]{37.4836, 127.0327}),
            Map.entry("성동구", new double[]{37.5633, 127.0367}),
            Map.entry("성북구", new double[]{37.5894, 127.0167}),
            Map.entry("송파구", new double[]{37.5145, 127.1059}),
            Map.entry("양천구", new double[]{37.5169, 126.8664}),
            Map.entry("영등포구", new double[]{37.5264, 126.8963}),
            Map.entry("용산구", new double[]{37.5326, 126.9905}),
            Map.entry("은평구", new double[]{37.6027, 126.9291}),
            Map.entry("종로구", new double[]{37.5735, 126.9788}),
            Map.entry("중구", new double[]{37.5641, 126.9979}),
            Map.entry("중랑구", new double[]{37.6063, 127.0925})
    );

    // region 문자열(예: "강남구 역삼동, 서초구 잠원동") 안에서 아는 구 이름을 찾아 좌표를 반환
    // 못 찾으면 서울시청 좌표(서울 전체를 보여주는 기본값)로 대체
    public static double[] findCoordinate(String region) {
        if (region != null) {
            for (Map.Entry<String, double[]> entry : COORDINATES.entrySet()) {
                if (region.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
        }
        return new double[]{SEOUL_CITY_HALL_LAT, SEOUL_CITY_HALL_LNG};
    }
}