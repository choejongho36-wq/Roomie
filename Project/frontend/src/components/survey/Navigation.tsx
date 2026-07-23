interface NavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: number[];
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  completing?: boolean;
}

function Navigation({
  currentQuestion,
  totalQuestions,
  answers,
  onPrevious,
  onNext,
  onComplete,
  completing = false,
}: NavigationProps) {
  const isFirstQuestion = currentQuestion === 0;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const hasAnswer = answers[currentQuestion] !== undefined;

  return (
    <div className="survey-navigation">
      <button
        type="button"
        className="nav-button nav-button-secondary"
        onClick={onPrevious}
        disabled={isFirstQuestion}
      >
        이전
      </button>
      {isLastQuestion ? (
        <button
          type="button"
          className="nav-button nav-button-primary"
          onClick={onComplete}
          disabled={!hasAnswer || completing}
        >
          {completing ? "제출 중..." : "완료"}
        </button>
      ) : (
        <button
          type="button"
          className="nav-button nav-button-primary"
          onClick={onNext}
          disabled={!hasAnswer}
        >
          다음
        </button>
      )}
    </div>
  );
}

export default Navigation;
