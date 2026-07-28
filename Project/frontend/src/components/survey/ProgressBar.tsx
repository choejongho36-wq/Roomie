interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

function ProgressBar({ currentQuestion, totalQuestions }: ProgressBarProps) {
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;
  const remaining = totalQuestions - currentQuestion - 1;

  return (
    <div className="progress-bar" aria-label="survey progress">
      <span className="progress-label">
        {currentQuestion + 1} / {totalQuestions}
        <span className="progress-cheer">
          {remaining === 0
            ? "🎉 마지막 질문이에요!"
            : `앞으로 ${remaining}문항만 더!`}
        </span>
      </span>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
