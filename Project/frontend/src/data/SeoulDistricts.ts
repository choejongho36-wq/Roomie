export interface SeoulZone {
  zone: string;
  districts: string[];
}

// 서울시 2040 도시기본계획 기준 5개 생활권역
export const SEOUL_ZONES: SeoulZone[] = [
  { zone: "도심권", districts: ["종로구", "중구", "용산구"] },
  {
    zone: "동북권",
    districts: ["성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구"],
  },
  { zone: "서북권", districts: ["은평구", "서대문구", "마포구"] },
  {
    zone: "서남권",
    districts: ["강서구", "양천구", "구로구", "금천구", "영등포구", "동작구", "관악구"],
  },
  { zone: "동남권", districts: ["서초구", "강남구", "송파구", "강동구"] },
];

export const ALL_ZONES = "전체";
export const ALL_DISTRICTS = "전체";

export const getDistrictsForZone = (zone: string): string[] =>
  SEOUL_ZONES.find((item) => item.zone === zone)?.districts ?? [];

// 지역 문자열(예: "서울 종로구", "종로구")에 특정 구가 포함되는지 느슨하게 매칭
export const regionMatchesDistrict = (region: string | null | undefined, district: string): boolean =>
  Boolean(region && region.includes(district));

export const regionMatchesZone = (region: string | null | undefined, zone: string): boolean =>
  getDistrictsForZone(zone).some((district) => regionMatchesDistrict(region, district));
