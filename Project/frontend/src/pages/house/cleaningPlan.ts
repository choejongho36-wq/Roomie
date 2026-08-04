// 청소 구역 페이지와 청소당번 페이지가 같이 쓰는 배정표.
// ponytail: 백엔드 API가 없어서 localStorage에 저장한다. 즉 같은 브라우저에서만 유지되고
// 룸메이트에게는 공유되지 않는다. 공유가 필요해지면 여기 load/save만 API 호출로 바꾸면 된다.

export const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export type Day = (typeof DAYS)[number];

// 요일 이름 → JS getDay() 값(일요일 0)
export const DOW_INDEX: Record<Day, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

// 일요일(0)~토요일(6) 기준의 JS getDay()를 DAYS 배열 인덱스(월요일 시작)로 바꿔준다.
export const todayIndex = (new Date().getDay() + 6) % 7;

export const ROOMS: Record<string, string> = {
  방: "침구 정리, 바닥 청소, 환기까지 확인해요.",
  거실: "공용 공간은 함께 쓰는 만큼 같이 치워요.",
  부엌: "설거지와 싱크대, 음식물 쓰레기까지.",
  화장실: "세면대와 변기, 배수구까지 주기적으로 관리해요.",
  현관: "신발 정리와 바닥 먼지를 가볍게 쓸어요.",
  베란다: "빨래 정리와 배수구, 창틀 먼지를 확인해요.",
};

export const CUSTOM_DESC = "직접 추가한 구역이에요.";

// ponytail: 매년 날짜가 같은 공휴일만 하드코딩. 설·추석·대체공휴일까지 필요해지면 공공데이터 API로.
export const HOLIDAYS = new Set(["1-1", "3-1", "5-5", "6-6", "8-15", "10-3", "10-9", "12-25"]);

export type Assignee = "me" | "partner";

export interface Plan {
  rooms: string[];
  days: Day[];
  time: string;
  holiday: boolean;
}

export type Plans = Record<Assignee, Plan>;

export const DEFAULT_PLANS: Plans = {
  me: { rooms: ["방", "화장실"], days: ["월", "목"], time: "20:00", holiday: true },
  partner: { rooms: ["거실", "부엌"], days: ["화", "금"], time: "20:00", holiday: true },
};

const storageKey = (houseId: string) => `roomie:cleaning:${houseId}`;

export function loadPlans(houseId: string | undefined): Plans {
  if (!houseId) return DEFAULT_PLANS;
  const saved = localStorage.getItem(storageKey(houseId));
  if (!saved) return DEFAULT_PLANS;
  try {
    // 저장 형식이 바뀌어도 빠진 항목은 기본값으로 채운다.
    const parsed = JSON.parse(saved) as Partial<Plans>;
    return {
      me: { ...DEFAULT_PLANS.me, ...parsed.me },
      partner: { ...DEFAULT_PLANS.partner, ...parsed.partner },
    };
  } catch {
    return DEFAULT_PLANS;
  }
}

export function savePlans(houseId: string | undefined, plans: Plans) {
  if (!houseId) return;
  localStorage.setItem(storageKey(houseId), JSON.stringify(plans));
}

// 그 날짜에 청소 당번인지. 선택한 요일이면서, 공휴일에 쉬기로 했으면 공휴일은 뺀다.
export function isDutyOn(plan: Plan, date: Date) {
  const isHoliday = HOLIDAYS.has(`${date.getMonth() + 1}-${date.getDate()}`);
  return plan.days.some((day) => DOW_INDEX[day] === date.getDay()) && !(isHoliday && plan.holiday);
}

export const timeLabel = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${String(minute).padStart(2, "0")}`;
};
