export type TagGroup = {
  label: string;
  tags: string[];
  /** true면 그룹 안에서 하나만 선택 (다시 고르면 교체) */
  exclusive?: boolean;
};

/** 생활 패턴 - 그룹당 1개. 순서는 설문 가중치(CompatibilityCalculator.WEIGHTS) 기준 */
export const LIFESTYLE_TAG_GROUPS: TagGroup[] = [
  { label: "흡연", exclusive: true, tags: ["비흡연", "흡연", "전자담배만"] },
  { label: "청결", exclusive: true, tags: ["깔끔한 편", "적당히 치우는 편", "자유로운 편"] },
  { label: "소음", exclusive: true, tags: ["소음에 무던한 편", "소음에 민감한 편"] },
  { label: "취침", exclusive: true, tags: ["일찍 잠", "늦게 잠"] },
  { label: "생활 패턴", exclusive: true, tags: ["아침형", "저녁형", "유동적"] },
  { label: "음주", exclusive: true, tags: ["안 마심", "가끔 음주", "자주 음주"] },
  { label: "손님 초대", exclusive: true, tags: ["초대 안 함", "가끔 초대", "자주 초대"] },
  { label: "물건 공유", exclusive: true, tags: ["공유 괜찮음", "각자 사용"] },
  { label: "요리", exclusive: true, tags: ["직접 요리", "배달/외식 위주"] },
  { label: "온도", exclusive: true, tags: ["더위 많이 탐", "추위 많이 탐"] },
  { label: "반려동물", exclusive: true, tags: ["반려동물 있음", "반려동물 없음", "동물 알레르기"] },
  { label: "직업", exclusive: true, tags: ["학생", "직장인", "재택근무"] },
  { label: "생활비", exclusive: true, tags: ["절약형", "적당히 쓰는 편", "여유로운 편"] },
  {
    label: "MBTI",
    exclusive: true,
    tags: [
      "INTJ", "INTP", "ENTJ", "ENTP",
      "INFJ", "INFP", "ENFJ", "ENFP",
      "ISTJ", "ISFJ", "ESTJ", "ESFJ",
      "ISTP", "ISFP", "ESTP", "ESFP",
    ],
  },
];

/** 취미·관심사 - 전체 합쳐서 MAX_INTEREST_TAGS개까지 */
export const INTEREST_TAG_GROUPS: TagGroup[] = [
  {
    label: "운동",
    tags: [
      "헬스", "홈트", "러닝", "등산", "클라이밍", "축구", "농구", "야구",
      "배드민턴", "테니스", "탁구", "볼링", "당구", "요가/필라테스",
      "자전거", "수영", "골프", "복싱/격투기", "스키/보드", "서핑", "크로스핏",
    ],
  },
  {
    label: "게임",
    tags: [
      "FPS", "AOS", "RPG", "MMORPG", "RTS", "액션", "어드벤처", "시뮬레이션",
      "스포츠게임", "레이싱", "리듬게임", "방치형", "인디게임", "콘솔게임",
      "모바일게임", "보드게임",
    ],
  },
  {
    label: "음악",
    tags: [
      "K-POP", "발라드", "힙합/랩", "R&B", "록/메탈", "인디", "재즈", "클래식",
      "EDM", "팝송", "시티팝", "OST", "트로트",
    ],
  },
  {
    label: "음식",
    tags: [
      "한식", "일식", "중식", "양식", "분식", "고기/구이", "해산물", "매운음식",
      "디저트/베이커리", "커피/카페", "채식", "술/안주", "맛집 탐방",
    ],
  },
  {
    label: "창작",
    tags: [
      "사진", "영상 편집", "그림/일러스트", "글쓰기", "개발/코딩", "DIY",
      "뜨개질/자수", "도예", "캘리그라피", "작곡", "3D 모델링", "블로그", "브이로그",
    ],
  },
  { label: "미디어", tags: ["영화", "드라마", "애니", "웹툰", "유튜브", "넷플릭스", "예능"] },
  { label: "문화", tags: ["독서", "전시/미술관", "공연/뮤지컬", "악기 연주"] },
  { label: "놀이", tags: ["방탈출", "PC방", "클럽/파티", "노래방"] },
  { label: "홈라이프", tags: ["인테리어/홈꾸미기", "정리/수납", "홈카페", "홈파티", "캔들/디퓨저"] },
  { label: "덕질/수집", tags: ["아이돌", "굿즈 수집", "피규어/레고", "프라모델", "포토카드"] },
  { label: "뷰티/패션", tags: ["화장품", "향수", "옷 쇼핑", "헤어/그루밍"] },
  { label: "야외", tags: ["여행", "캠핑", "드라이브", "산책", "낚시", "공연/페스티벌"] },
  { label: "스포츠 관람", tags: ["야구 관람", "축구 관람", "농구 관람", "e스포츠 관람"] },
  { label: "자기계발", tags: ["공부/자격증", "외국어", "독서모임", "강연/세미나"] },
  {
    label: "학문",
    tags: [
      "역사", "철학", "심리학", "과학", "우주/천문", "경제/경영",
      "정치/시사", "IT/기술", "문학", "수학", "의학/건강",
    ],
  },
  { label: "기타", tags: ["식물 키우기", "재테크", "봉사활동"] },
];

export const TAG_SECTIONS = [
  { label: "생활 패턴", groups: LIFESTYLE_TAG_GROUPS },
  { label: "취미·관심사", groups: INTEREST_TAG_GROUPS },
];

export type TagSection = (typeof TAG_SECTIONS)[number];

export const PROFILE_TAG_GROUPS = [...LIFESTYLE_TAG_GROUPS, ...INTEREST_TAG_GROUPS];

export const PROFILE_TAGS = PROFILE_TAG_GROUPS.flatMap((g) => g.tags);

export const LIFESTYLE_TAGS = new Set(LIFESTYLE_TAG_GROUPS.flatMap((g) => g.tags));

/** 태그 → 속한 그룹 라벨 ("비흡연" → "흡연") */
export const TAG_GROUP_LABEL = new Map(
  PROFILE_TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t, g.label] as const)),
);

export const MAX_INTEREST_TAGS = 8;

/** 배타 그룹은 1개, 다중 선택 그룹(소음)은 태그 수만큼 */
export const MAX_LIFESTYLE_TAGS = LIFESTYLE_TAG_GROUPS.reduce(
  (sum, g) => sum + (g.exclusive ? 1 : g.tags.length),
  0,
);

export const MAX_PROFILE_TAGS = MAX_LIFESTYLE_TAGS + MAX_INTEREST_TAGS;
