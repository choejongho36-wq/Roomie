interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
}

function ProgressBar({ currentQuestion, totalQuestions }: ProgressBarProps) {
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="progress-bar" aria-label="survey progress">
      <span className="progress-label">
        Question {currentQuestion + 1} / {totalQuestions}
      </span>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
