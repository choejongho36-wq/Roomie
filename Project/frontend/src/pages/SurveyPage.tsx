import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "../hooks/UseSurvey";
import { surveyQuestions } from "../data/SurveyQuestions";
import { useAuth } from "../context/AuthContext";
import { submitSurvey } from "../api";
import SurveyHeader from "../components/survey/SurveyHeader";
import ProgressBar from "../components/survey/ProgressBar";
import QuestionCard from "../components/survey/QuestionCard";
import Navigation from "../components/survey/Navigation";
import { SurveyIntro } from "../components/survey/SurveyHelp";
import "./SurveyPage.css";

function SurveyPage() {
  const {
    currentQuestion,
    answers,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
  } = useSurvey(surveyQuestions.length);
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // 모바일은 화면이 좁아 도움말 카드를 건너뛴다 (도움말은 ? 버튼으로)
  const [showIntro, setShowIntro] = useState(window.innerWidth > 768);

  const currentSurveyQuestion = surveyQuestions[currentQuestion];
  const totalQuestions = surveyQuestions.length;

  // 선택하면 자동으로 다음 문항으로 (마지막 문항 제외)
  // 예약된 이동은 항상 1개만 유지해야 문항을 건너뛰지 않는다
  const advanceTimer = useRef<number | undefined>(undefined);
  const handleSelect = (score: number) => {
    selectAnswer(score);
    if (currentQuestion < totalQuestions - 1) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(nextQuestion, 280);
    }
  };
  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  // 숫자키 1~5로 선택, 좌우 화살표로 이동
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // 도움말 화면에서는 숫자키가 1번 문항에 몰래 답하면 안 된다
      if (showIntro) {
        if (event.key === "Enter" || event.key === "ArrowRight") setShowIntro(false);
        return;
      }
      const index = Number(event.key) - 1;
      if (index >= 0 && index < currentSurveyQuestion.options.length) {
        handleSelect(currentSurveyQuestion.options[index].score);
      } else if (event.key === "ArrowLeft") {
        previousQuestion();
      } else if (event.key === "ArrowRight" && answers[currentQuestion] !== undefined) {
        nextQuestion();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleComplete = async () => {
    if (!token) {
      navigate("/");
      return;
    }
    // 빈 문항이 있으면 서버로 보내지 않고 해당 문항으로 되돌린다
    const missing = surveyQuestions.findIndex((_, i) => answers[i] === undefined);
    if (missing !== -1) {
      setSubmitError(`${missing + 1}번 문항에 답하지 않았어요.`);
      goToQuestion(missing);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitSurvey(token, answers);
      navigate("/survey/complete");
    } catch {
      setSubmitError("설문 제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-page">
      <div className="survey-shell">
        <SurveyHeader />
        {showIntro ? (
          <>
            <SurveyIntro />
            <div className="survey-navigation">
              <button
                type="button"
                className="nav-button nav-button-primary"
                onClick={() => setShowIntro(false)}
              >
                설문 시작하기
              </button>
            </div>
          </>
        ) : (
          <>
            <ProgressBar
              currentQuestion={currentQuestion}
              totalQuestions={totalQuestions}
            />
            <QuestionCard
              key={currentQuestion}
              question={currentSurveyQuestion}
              currentQuestion={currentQuestion}
              answers={answers}
              selectAnswer={handleSelect}
            />
            {submitError && <p className="survey-error">{submitError}</p>}
            <Navigation
              currentQuestion={currentQuestion}
              totalQuestions={totalQuestions}
              answers={answers}
              onPrevious={previousQuestion}
              onNext={nextQuestion}
              onComplete={handleComplete}
              completing={submitting}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default SurveyPage;
