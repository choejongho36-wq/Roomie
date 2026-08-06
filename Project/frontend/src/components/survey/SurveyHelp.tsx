import { useState } from "react";

export const helpItems = [
  "번호로 항목을 선택할 수 있어요",
  "앞뒤 버튼으로 질문을 이동할 수 있어요",
  "완료까지 약 3분 정도 걸려요",
  "솔직하게 답변할수록 더 정확한 매칭을 받을 수 있어요",
];

// 데스크톱은 마우스 올리면, 모바일은 눌러야 열린다
// (터치는 mouseenter를 흉내 내므로 pointerType으로 걸러야 탭이 먹는다)
export function HelpTip() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="help-tip"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        type="button"
        className="help-tip-button"
        aria-label="설문 도움말"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <ul className="help-tip-bubble" role="tooltip">
          {helpItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SurveyIntro() {
  return (
    <section className="survey-intro-plain">
      <h2 className="question-text">이렇게 진행돼요</h2>
      <ul className="survey-intro-list">
        {helpItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
