import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./SupportPage.css";

const FAQS = [
  {
    q: "룸메이트 매칭은 어떻게 이루어지나요?",
    a: "설문에 답하시면 Roomie가 생활 패턴, 청결도, 가치관, 선호도를 종합 분석해서 궁합 점수가 가장 높은 상대를 추천해드려요.",
  },
  {
    q: "설문 답변을 다시 수정할 수 있나요?",
    a: "마이페이지 > 설문 기록에서 문항별로 답변을 다시 고르거나, 설문 전체를 새로 진행할 수 있어요.",
  },
  {
    q: "매칭이 확정되면 무엇을 할 수 있나요?",
    a: "매칭이 확정되면 하우스가 생성돼요. 하우스에서 관리비 정산, 청소당번, 하우스 규칙 등을 함께 관리할 수 있어요(일부 기능은 순차적으로 업데이트될 예정이에요).",
  },
  {
    q: "회원 탈퇴는 어떻게 하나요?",
    a: "마이페이지 > 프로필 편집에서 회원 탈퇴를 진행할 수 있어요. 탈퇴 시 계정 정보는 관련 법령에 따라 처리돼요.",
  },
];

const SOCIAL_LINKS = [
  { name: "인스타그램", handle: "@roomie_official" },
  { name: "카카오톡 채널", handle: "채널 Roomie" },
  { name: "블로그", handle: "Roomie 공식 블로그" },
];

function SupportPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="support-page">
      <div className="support-inner">
        <h1 className="support-title">고객센터</h1>
        <p className="support-subtitle">궁금한 점을 빠르게 해결해드릴게요.</p>

        <div className="support-grid">
          <section className="support-card">
            <h2>전화 문의</h2>
            <p className="support-phone">1544-0000</p>
            <p className="support-hours">문의 가능 시간: 평일 09:00 ~ 18:00 (주말·공휴일 휴무)</p>
          </section>

          <section className="support-card">
            <h2>챗봇 안내</h2>
            <p>
              AI 챗봇이 24시간 상담을 도와드려요. 궁금한 점을 물어보세요.
            </p>
            <p className="support-note">챗봇 상담 기능은 현재 준비 중이에요.</p>
          </section>

          <section className="support-card">
            <h2>문의 게시판 안내</h2>
            <p>
              전화 연결이 어려우시다면 문의 게시판에 글을 남겨주세요.
            </p>
            <p>
              확인 후 답변을 등록해드려요.
            </p>
            <Link to="/inquiry" className="support-link-button">
              문의 게시판 가기
            </Link>
          </section>

          <section className="support-card support-card-social">
            <h2>소셜미디어</h2>
            <ul className="support-social-list">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.name} className="support-social-item">
                  <span className="support-social-name">{s.name}</span>
                  <span className="support-social-handle">{s.handle}</span>
                  <span className="support-note-inline">준비 중</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="support-faq">
          <h2>자주 묻는 질문</h2>
          <div className="support-faq-list">
            {FAQS.map((item) => (
              <details className="support-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default SupportPage;
