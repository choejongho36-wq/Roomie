import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMatchedPair } from "../../api";
import type { MatchedPair } from "../../types/matchedPair";
import "../mypage/MyPageContent.css";
import "./HouseCard.css";
import "./HouseBillsPage.css";

interface Bill {
  billId: number;
  title: string;
  amount: number;
  paidBy: "me" | "partner";
}

const formatWon = (n: number) => n.toLocaleString("ko-KR") + "원";

// 백엔드에 정산 기능이 아직 없어서, 지금은 이 페이지 안에서만 유지되는 임시(로컬) 데이터로 동작한다.
// 새로고침하면 초기화된다 — 실제 저장이 필요해지면 API가 추가돼야 한다.
function HouseBillsPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [pair, setPair] = useState<MatchedPair | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<"me" | "partner">("me");
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    if (!token || !id) return;
    getMatchedPair(token, Number(id)).then(setPair).catch(() => setPair(null));
  }, [token, id]);

  const meName = pair?.me.nickname ?? "나";
  const partnerName = pair?.partner.nickname ?? "룸메이트";

  const totalPaidByMe = bills.filter((b) => b.paidBy === "me").reduce((sum, b) => sum + b.amount, 0);
  const totalPaidByPartner = bills.filter((b) => b.paidBy === "partner").reduce((sum, b) => sum + b.amount, 0);
  const total = totalPaidByMe + totalPaidByPartner;
  const fairShare = total / 2;
  const meBalance = totalPaidByMe - fairShare;

  const handleAdd = () => {
    const parsedAmount = Number(amount);
    if (!title.trim() || !parsedAmount || parsedAmount <= 0) return;
    setBills((prev) => [...prev, { billId: nextId, title: title.trim(), amount: parsedAmount, paidBy }]);
    setNextId((n) => n + 1);
    setTitle("");
    setAmount("");
  };

  const handleDelete = (billId: number) => {
    setBills((prev) => prev.filter((b) => b.billId !== billId));
  };

  return (
    <div className="mypage-panel">
      <h1 className="mypage-panel-title">관리비 정산</h1>
      <p className="mypage-panel-desc">함께 낸 관리비를 등록하고 반반 정산 결과를 확인해보세요.</p>

      <div className="house-card house-bills-summary">
        {total === 0 ? (
          <p className="house-bills-empty-summary">아직 등록된 관리비가 없어요.</p>
        ) : (
          <>
            <div className="house-bills-summary-row">
              <span>총 지출</span>
              <strong>{formatWon(total)}</strong>
            </div>
            <div className="house-bills-summary-row">
              <span>1인당 부담금</span>
              <strong>{formatWon(fairShare)}</strong>
            </div>
            <div className="house-bills-balance">
              {meBalance === 0 ? (
                <span>정산이 딱 맞아요.</span>
              ) : meBalance > 0 ? (
                <span>
                  <strong>{partnerName}</strong>님이 <strong>{meName}</strong>님에게{" "}
                  <strong>{formatWon(meBalance)}</strong> 보내주면 돼요.
                </span>
              ) : (
                <span>
                  <strong>{meName}</strong>님이 <strong>{partnerName}</strong>님에게{" "}
                  <strong>{formatWon(-meBalance)}</strong> 보내주면 돼요.
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="house-card house-bills-form">
        <input
          type="text"
          placeholder="항목 (예: 전기세)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="house-bills-input"
        />
        <input
          type="number"
          placeholder="금액"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="house-bills-input house-bills-input-amount"
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value as "me" | "partner")}
          className="house-bills-select"
        >
          <option value="me">{meName}이(가) 냈어요</option>
          <option value="partner">{partnerName}이(가) 냈어요</option>
        </select>
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          추가
        </button>
      </div>

      {bills.length > 0 && (
        <div className="house-card house-bills-list">
          {bills.map((bill) => (
            <div key={bill.billId} className="house-bills-list-row">
              <span className="house-bills-list-title">{bill.title}</span>
              <span className="house-bills-list-payer">{bill.paidBy === "me" ? meName : partnerName}</span>
              <span className="house-bills-list-amount">{formatWon(bill.amount)}</span>
              <button
                type="button"
                className="house-bills-delete"
                aria-label="삭제"
                onClick={() => handleDelete(bill.billId)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HouseBillsPage;
