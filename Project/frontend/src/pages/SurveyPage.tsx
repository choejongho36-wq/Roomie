import { useState } from "react";
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
          question={currentSurveyQuestion}
          currentQuestion={currentQuestion}
          answers={answers}
          selectAnswer={selectAnswer}
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
