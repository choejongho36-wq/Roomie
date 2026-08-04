import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMatchedPair } from "../../api";
import type { MatchedPair } from "../../types/matchedPair";
import "../mypage/MyPageContent.css";
import "./HouseCard.css";
import "./HouseCleaningPage.css";

import {
  CUSTOM_DESC,
  DAYS,
  DOW_INDEX,
  HOLIDAYS,
  ROOMS,
  loadPlans,
  savePlans,
  timeLabel,
} from "./cleaningPlan";
import type { Assignee, Day, Plan, Plans } from "./cleaningPlan";

// input[type=time]은 크롬에서 분 칸을 60개 다 돌려야 해서 고르기 번거롭다. 30분 단위 목록으로 대신한다.
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  return `${hour}:${i % 2 ? "30" : "00"}`;
});

const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

function HouseCleaningPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [pair, setPair] = useState<MatchedPair | null>(null);
  const [plans, setPlans] = useState<Plans>(() => loadPlans(id));
  const [selected, setSelected] = useState<Assignee>("me");
  const [calMonth, setCalMonth] = useState(() => firstOfMonth(new Date()));
  const [customRoom, setCustomRoom] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id)).then(setPair).catch(() => setPair(null));
  }, [token, id]);

  const names: Record<Assignee, string> = {
    me: pair?.me.nickname ?? "나",
    partner: pair?.partner.nickname ?? "룸메이트",
  };

  const plan = plans[selected];
  const updatePlan = (patch: Partial<Plan>) => {
    setPlans((prev) => ({ ...prev, [selected]: { ...prev[selected], ...patch } }));
    setSaved(false);
  };

  const handleSave = () => {
    savePlans(id, plans);
    setSaved(true);
  };

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
    // 주말은 요일 토글에서 직접 고르므로 별도 규칙이 없다. 공휴일은 실제 공휴일만 본다.
    const isHoliday = HOLIDAYS.has(`${month + 1}-${date}`);

    const duty = dutyDows.has(dow) && !(isHoliday && plan.holiday);

    return {
      date,
      isRed: isHoliday || dow === 0, // 달력에 빨갛게 칠할 날 (표시용)
      duty,
      isToday:
        date === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
    };
  });

  const shiftMonth = (delta: number) => setCalMonth(new Date(year, month + delta, 1));

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">청소 구역</h1>
      <p className="mypage-panel-desc">누가 어디를, 무슨 요일에 치울지 나눠보세요.</p>

      <div className="house-card house-clean-members">
        {(["me", "partner"] as Assignee[]).map((who) => (
          <button
            type="button"
            key={who}
            className={`house-clean-member${selected === who ? " house-clean-member-active" : ""}`}
            onClick={() => setSelected(who)}
          >
            <span className={`house-clean-avatar house-clean-avatar-${who}`}>{names[who][0]}</span>
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

          <div className="house-clean-save">
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              저장
            </button>
            <span className="house-clean-save-hint">
              {saved ? "저장했어요. 청소당번에도 반영돼요." : "저장해야 청소당번에 반영돼요."}
            </span>
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
                className={`house-clean-date${cell.isRed ? " house-clean-date-holiday" : ""}${
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
