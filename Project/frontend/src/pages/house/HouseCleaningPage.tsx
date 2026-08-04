import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN, getMatchedPair } from "../../api";
import type { MatchedPair } from "../../types/matchedPair";
import "../mypage/MyPageContent.css";
import "./HouseCard.css";
import "./HouseCleaningPage.css";

const getAvatarSrc = (url: string | null) => (url ? `${API_ORIGIN}${url}` : null);

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
type Day = (typeof DAYS)[number];

// 요일 이름 → JS getDay() 값(일요일 0)
const DOW_INDEX: Record<Day, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

const ROOMS: Record<string, string> = {
  방: "침구 정리, 바닥 청소, 환기까지 확인해요.",
  거실: "공용 공간은 함께 쓰는 만큼 같이 치워요.",
  부엌: "설거지와 싱크대, 음식물 쓰레기까지.",
  화장실: "세면대와 변기, 배수구까지 주기적으로 관리해요.",
  현관: "신발 정리와 바닥 먼지를 가볍게 쓸어요.",
  베란다: "빨래 정리와 배수구, 창틀 먼지를 확인해요.",
};

const CUSTOM_DESC = "직접 추가한 구역이에요.";

// input[type=time]은 크롬에서 분 칸을 60개 다 돌려야 해서 고르기 번거롭다. 30분 단위 목록으로 대신한다.
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  return `${hour}:${i % 2 ? "30" : "00"}`;
});

const timeLabel = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${String(minute).padStart(2, "0")}`;
};

// ponytail: 매년 날짜가 같은 공휴일만 하드코딩. 설·추석·대체공휴일까지 필요해지면 공공데이터 API로.
const HOLIDAYS = new Set(["1-1", "3-1", "5-5", "6-6", "8-15", "10-3", "10-9", "12-25"]);

type Assignee = "me" | "partner";

interface Plan {
  rooms: string[];
  days: Day[];
  time: string;
  weekend: boolean;
  holiday: boolean;
}

const DEFAULT_PLANS: Record<Assignee, Plan> = {
  me: { rooms: ["방", "화장실"], days: ["월", "목"], time: "20:00", weekend: false, holiday: true },
  partner: { rooms: ["거실", "부엌"], days: ["화", "금"], time: "20:00", weekend: false, holiday: true },
};

const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

// 백엔드에 청소 구역 기능이 아직 없어서, 지금은 이 페이지 안에서만 유지되는 임시(로컬) 데이터로 동작한다.
// 새로고침하면 기본 배정으로 초기화된다.
function HouseCleaningPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [pair, setPair] = useState<MatchedPair | null>(null);
  const [plans, setPlans] = useState<Record<Assignee, Plan>>(DEFAULT_PLANS);
  const [selected, setSelected] = useState<Assignee>("me");
  const [calMonth, setCalMonth] = useState(() => firstOfMonth(new Date()));
  const [customRoom, setCustomRoom] = useState("");

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id)).then(setPair).catch(() => setPair(null));
  }, [token, id]);

  const names: Record<Assignee, string> = {
    me: pair?.me.nickname ?? "나",
    partner: pair?.partner.nickname ?? "룸메이트",
  };

  const avatars: Record<Assignee, string | null> = {
    me: getAvatarSrc(pair?.me.profileImageUrl ?? null),
    partner: getAvatarSrc(pair?.partner.profileImageUrl ?? null),
  };

  const plan = plans[selected];
  const updatePlan = (patch: Partial<Plan>) =>
    setPlans((prev) => ({ ...prev, [selected]: { ...prev[selected], ...patch } }));

  // 이미 누가 맡은 구역은 후보에서 뺀다.
  const taken = new Set([...plans.me.rooms, ...plans.partner.rooms]);
  const available = Object.keys(ROOMS).filter((room) => !taken.has(room));

  const addRoom = (room: string) => updatePlan({ rooms: [...plan.rooms, room] });

  const addCustomRoom = () => {
    const room = customRoom.trim();
    if (!room || taken.has(room)) return;
    addRoom(room);
    setCustomRoom("");
  };

  const toggleDay = (day: Day) =>
    updatePlan({
      days: plan.days.includes(day)
        ? plan.days.filter((d) => d !== day)
        : [...plan.days, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)),
    });

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const today = new Date();
  const dutyDows = new Set(plan.days.map((d) => DOW_INDEX[d]));

  const cells = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
    const date = i + 1;
    const dow = new Date(year, month, date).getDay();
    const isHoliday = HOLIDAYS.has(`${month + 1}-${date}`) || dow === 0;
    const isWeekend = dow === 0 || dow === 6;

    let duty = dutyDows.has(dow);
    if (duty && isWeekend && !plan.weekend) duty = false;
    if (duty && isHoliday && plan.holiday) duty = false;

    return {
      date,
      isHoliday,
      duty,
      isToday:
        date === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
    };
  });

  const shiftMonth = (delta: number) => setCalMonth(new Date(year, month + delta, 1));

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">청소당번</h1>
      <p className="mypage-panel-desc">누가 어디를, 무슨 요일에 치울지 나눠보세요.</p>

      <div className="house-card house-clean-members">
        {(["me", "partner"] as Assignee[]).map((who) => (
          <button
            type="button"
            key={who}
            className={`house-clean-member${selected === who ? " house-clean-member-active" : ""}`}
            onClick={() => setSelected(who)}
          >
            {avatars[who] ? (
              <img className="house-clean-avatar" src={avatars[who]!} alt="" />
            ) : (
              <span className={`house-clean-avatar house-clean-avatar-${who}`}>{names[who][0]}</span>
            )}
            <span className="house-clean-member-text">
              <span className="house-clean-member-name">{names[who]}</span>
              <span className="house-clean-member-rooms">
                {plans[who].rooms.length ? plans[who].rooms.join(", ") : "배정 없음"}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="house-clean-columns">
        <div>
          <div className="house-card">
            <h2 className="house-clean-title">청소 요일</h2>
            <div className="house-clean-dayrow">
              <div className="house-clean-days">
                {DAYS.map((day) => {
                  const weekend = day === "토" || day === "일";
                  return (
                    <button
                      type="button"
                      key={day}
                      className={`house-clean-day${plan.days.includes(day) ? " house-clean-day-on" : ""}${
                        weekend ? " house-clean-day-weekend" : ""
                      }`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <label className="house-clean-time">
                <span>청소 시간</span>
                <select value={plan.time} onChange={(e) => updatePlan({ time: e.target.value })}>
                  {TIMES.map((time) => (
                    <option key={time} value={time}>
                      {timeLabel(time)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="house-clean-options">
              <label>
                <input
                  type="checkbox"
                  checked={plan.weekend}
                  onChange={(e) => updatePlan({ weekend: e.target.checked })}
                />
                <span>주말도 청소</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={plan.holiday}
                  onChange={(e) => updatePlan({ holiday: e.target.checked })}
                />
                <span>공휴일은 쉬기</span>
              </label>
            </div>
          </div>

          <div className="house-card">
            <h2 className="house-clean-title">{names[selected]}님이 맡은 구역</h2>
            {plan.rooms.length ? (
              <div className="house-clean-rooms">
                {plan.rooms.map((room) => (
                  <div key={room} className="house-clean-room">
                    <button
                      type="button"
                      className="house-clean-room-remove"
                      aria-label={`${room} 배정 해제`}
                      onClick={() => updatePlan({ rooms: plan.rooms.filter((r) => r !== room) })}
                    >
                      ×
                    </button>
                    <h3>{room}</h3>
                    <p>{ROOMS[room] ?? CUSTOM_DESC}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="house-clean-empty">아직 배정된 청소 구역이 없어요.</p>
            )}
            <div className="house-clean-picker">
              {available.map((room) => (
                <button
                  type="button"
                  key={room}
                  className="house-clean-add"
                  onClick={() => addRoom(room)}
                >
                  + {room}
                </button>
              ))}
              <div className="house-clean-custom">
                <input
                  type="text"
                  value={customRoom}
                  placeholder="사용자 지정 (예: 다용도실)"
                  maxLength={12}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomRoom()}
                />
                <button
                  type="button"
                  className="house-clean-add"
                  disabled={!customRoom.trim() || taken.has(customRoom.trim())}
                  onClick={addCustomRoom}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="house-card house-clean-calendar">
          <div className="house-clean-calendar-head">
            <button type="button" className="house-clean-calendar-nav" onClick={() => shiftMonth(-1)}>
              ‹
            </button>
            <strong>
              {year}년 {month + 1}월
            </strong>
            <button type="button" className="house-clean-calendar-nav" onClick={() => shiftMonth(1)}>
              ›
            </button>
          </div>
          <div className="house-clean-calendar-grid">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="house-clean-dow">
                {d}
              </div>
            ))}
            {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {cells.map((cell) => (
              <div
                key={cell.date}
                className={`house-clean-date${cell.isHoliday ? " house-clean-date-holiday" : ""}${
                  cell.duty ? " house-clean-date-duty" : ""
                }${cell.isToday ? " house-clean-date-today" : ""}`}
              >
                {cell.date}
              </div>
            ))}
          </div>
          <p className="house-clean-legend">
            주황색 = {names[selected]}님의 청소 당번일
            <br />
            빨간 날짜 = 일요일·공휴일
          </p>
        </div>
      </div>
    </div>
  );
}

export default HouseCleaningPage;
