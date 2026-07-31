import roomieLogo from "../../assets/Roomie_logo.png";

interface SurveyHeaderProps {
  showGreeting?: boolean;
}

function SurveyHeader({ showGreeting = false }: SurveyHeaderProps) {
  return (
    <header className="survey-header">
      <h1 className="survey-title">생활 성향 설문</h1>
      <p className="survey-description">더 정확한 룸메이트 추천을 위해 생활 성향 설문을 작성해주세요.</p>
      {showGreeting && (
        <div className="survey-greeting">
          <div className="survey-greeting-row">
            <img src={roomieLogo} alt="Roomie" className="survey-greeting-avatar" />
            <div className="survey-greeting-bubbles">
              <p className="survey-greeting-bubble">안녕하세요, 저는 루미예요!</p>
              <p className="survey-greeting-bubble">딱 맞는 룸메이트를 찾을 수 있도록 몇 가지만 여쭤볼게요.</p>
            </div>
          </div>
          <div className="survey-reply-row">
            <p className="survey-greeting-bubble survey-greeting-bubble-reply">...</p>
            <img src={roomieLogo} alt="Roomie" className="survey-reply-avatar" />
          </div>
        </div>
      )}
    </header>
  );
}

export default SurveyHeader;
