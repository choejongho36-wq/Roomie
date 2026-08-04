import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMatchedPair } from "../../api";
import type { MatchedPair } from "../../types/matchedPair";
import { DAYS, isDutyOn, loadPlans, timeLabel, todayIndex } from "./cleaningPlan";
import type { Assignee } from "./cleaningPlan";
import "../mypage/MyPageContent.css";
import "./HouseCard.css";
import "./HouseChoresPage.css";

const ASSIGNEES: Assignee[] = ["me", "partner"];

// 이번 주 월요일. 요일별 칸에 실제 날짜를 붙여야 공휴일 여부를 따질 수 있다.
const mondayOfThisWeek = () => {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - todayIndex);
  return monday;
};

// 배정은 청소 구역 페이지에서 하고, 여기서는 저장된 배정표를 이번 주 기준으로 보여주기만 한다.
function HouseChoresPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [pair, setPair] = useState<MatchedPair | null>(null);
  const plans = loadPlans(id);

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id)).then(setPair).catch(() => setPair(null));
  }, [token, id]);

  const names: Record<Assignee, string> = {
    me: pair?.me.nickname ?? "나",
    partner: pair?.partner.nickname ?? "룸메이트",
  };

  const monday = mondayOfThisWeek();
  const week = DAYS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { day, date, onDuty: ASSIGNEES.filter((who) => isDutyOn(plans[who], date)) };
  });

  const todayDuty = week[todayIndex];

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">청소당번</h1>
      <p className="mypage-panel-desc">
        청소 구역에서 정한 배정표예요. 바꾸려면 <Link to={`/house/${id}/cleaning`}>청소 구역</Link>에서
        수정하고 저장해주세요.
      </p>

      <div className="house-card house-chores-today">
        <span>오늘({todayDuty.day}요일)은</span>
        {todayDuty.onDuty.length ? (
          <>
            <strong>{todayDuty.onDuty.map((who) => names[who]).join(", ")}</strong>
            <span>차례예요.</span>
          </>
        ) : (
          <strong>쉬는 날이에요.</strong>
        )}
      </div>

      <div className="house-card house-chores-week">
        {week.map(({ day, onDuty }, index) => (
          <div
            key={day}
            className={`house-chores-day${index === todayIndex ? " house-chores-day-today" : ""}`}
          >
            <span className="house-chores-day-label">{day}</span>
            {onDuty.length ? (
              onDuty.map((who) => (
                <span
                  key={who}
                  className={`house-chores-day-assignee house-chores-day-assignee-${who}`}
                >
                  {names[who]}
                </span>
              ))
            ) : (
              <span className="house-chores-day-rest">-</span>
            )}
          </div>
        ))}
      </div>

      <div className="house-card house-chores-detail">
        {ASSIGNEES.map((who) => (
          <div key={who} className="house-chores-detail-row">
            <span className={`house-chores-day-assignee house-chores-day-assignee-${who}`}>
              {names[who]}
            </span>
            <span className="house-chores-detail-rooms">
              {plans[who].rooms.length ? plans[who].rooms.join(", ") : "배정된 구역 없음"}
            </span>
            <span className="house-chores-detail-time">{timeLabel(plans[who].time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HouseChoresPage;
