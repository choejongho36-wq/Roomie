import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "../hooks/UseSurvey";
import { surveyQuestions } from "../data/SurveyQuestions";
import { useAuth } from "../context/AuthContext";
import { submitSurvey } from "../api";
import SurveyHeader from "../components/survey/SurveyHeader";
import ProgressBar from "../components/survey/ProgressBar";
import QuestionCard from "../components/survey/QuestionCard";
import Navigation from "../components/survey/Navigation";
import "./SurveyPage.css";

function SurveyPage() {
  const {
    currentQuestion,
    answers,
    selectAnswer,
    nextQuestion,
    previousQuestion,
  } = useSurvey(surveyQuestions.length);
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const currentSurveyQuestion = surveyQuestions[currentQuestion];
  const totalQuestions = surveyQuestions.length;

  // 선택하면 자동으로 다음 문항으로 (마지막 문항 제외)
  const handleSelect = (score: number) => {
    selectAnswer(score);
    if (currentQuestion < totalQuestions - 1) {
      setTimeout(nextQuestion, 280);
    }
  };

  // 숫자키 1~5로 선택, 좌우 화살표로 이동
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
      </div>
    </div>
  );
}

export default SurveyPage;
