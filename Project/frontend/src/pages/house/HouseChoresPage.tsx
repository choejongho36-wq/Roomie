import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMatchedPair } from "../../api";
import type { MatchedPair } from "../../types/matchedPair";
import "../mypage/MyPageContent.css";
import "./HouseCard.css";
import "./HouseChoresPage.css";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
type Day = (typeof DAYS)[number];
type Assignee = "me" | "partner";

// 일요일(0)~토요일(6) 기준의 JS getDay()를 DAYS 배열 인덱스(월요일 시작)로 바꿔준다.
const todayIndex = (new Date().getDay() + 6) % 7;

const DEFAULT_SCHEDULE: Record<Day, Assignee> = {
  월: "me",
  화: "partner",
  수: "me",
  목: "partner",
  금: "me",
  토: "partner",
  일: "me",
};

// 백엔드에 청소당번 기능이 아직 없어서, 지금은 이 페이지 안에서만 유지되는 임시(로컬) 데이터로 동작한다.
// 새로고침하면 기본 배정(월/수/금/일 나, 화/목/토 상대방)으로 초기화된다.
function HouseChoresPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [pair, setPair] = useState<MatchedPair | null>(null);
  const [schedule, setSchedule] = useState<Record<Day, Assignee>>(DEFAULT_SCHEDULE);

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id)).then(setPair).catch(() => setPair(null));
  }, [token, id]);

  const meName = pair?.me.nickname ?? "나";
  const partnerName = pair?.partner.nickname ?? "룸메이트";

  const toggleDay = (day: Day) => {
    setSchedule((prev) => ({ ...prev, [day]: prev[day] === "me" ? "partner" : "me" }));
  };

  const todayLabel = DAYS[todayIndex];
  const todayAssignee = schedule[todayLabel] === "me" ? meName : partnerName;

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">청소당번</h1>
      <p className="mypage-panel-desc">요일을 눌러서 담당자를 바꿀 수 있어요.</p>

      <div className="house-card house-chores-today">
        <span>오늘({todayLabel}요일)은</span>
        <strong>{todayAssignee}</strong>
        <span>차례예요.</span>
      </div>

      <div className="house-card house-chores-week">
        {DAYS.map((day, index) => {
          const assignee = schedule[day];
          const isToday = index === todayIndex;
          return (
            <button
              type="button"
              key={day}
              className={`house-chores-day${isToday ? " house-chores-day-today" : ""}`}
              onClick={() => toggleDay(day)}
            >
              <span className="house-chores-day-label">{day}</span>
              <span className={`house-chores-day-assignee house-chores-day-assignee-${assignee}`}>
                {assignee === "me" ? meName : partnerName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HouseChoresPage;
