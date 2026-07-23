import "./InquiryPage.css";

// 상단 2칸(좌/우)으로 배치할 항목
const TOP_TWO = ["루미 로그인", "로그인 문제인가요?"];

// 나머지 세로 목록 항목
const CATEGORIES = [
  "자주 묻는 질문",
  "계정 / 프로필",
  "매칭 관련",
  "룸메이트 모집",
  "결제 / 포인트",
  "신고 / 차단",
  "1:1 질문",
];

function InquiryPage() {
  return (
    <div className="inquiry-page">
      <div className="inquiry-inner">
        <h1 className="inquiry-title">무엇을 도와드릴까요?</h1>
        <p className="inquiry-subtitle">문의하실 항목을 선택해 주세요.</p>

        {/* 상단 2칸 (좌 / 우) */}
        <div className="inquiry-top">
          {TOP_TWO.map((label) => (
            <button type="button" className="inquiry-item" key={label}>
              <span>{label}</span>
              <span className="inquiry-arrow" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>

        {/* 나머지 세로 목록 */}
        <ul className="inquiry-list">
          {CATEGORIES.map((label) => (
            <li key={label}>
              <button type="button" className="inquiry-item">
                <span>{label}</span>
                <span className="inquiry-arrow" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* 챗봇 버튼 (왼쪽 정렬) */}
        <div className="inquiry-chatbot-row">
          <button type="button" className="inquiry-chatbot">
            💬 챗봇에게 물어보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default InquiryPage;
