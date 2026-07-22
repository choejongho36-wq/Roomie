import { useSurvey } from "../hooks/UseSurvey";
import { surveyQuestions } from "../data/SurveyQuestions";
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

  const currentSurveyQuestion = surveyQuestions[currentQuestion];
  const totalQuestions = surveyQuestions.length;

  const handleComplete = () => {
    console.log(answers);
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
        <Navigation
          currentQuestion={currentQuestion}
          totalQuestions={totalQuestions}
          answers={answers}
          onPrevious={previousQuestion}
          onNext={nextQuestion}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

export default SurveyPage;
