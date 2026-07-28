import type { SurveyQuestion } from "../../types/survey";
import { categoryEmoji } from "../../data/SurveyQuestions";
import OptionButton from "./OptionButton";

interface QuestionCardProps {
  question: SurveyQuestion;
  currentQuestion: number;
  answers: number[];
  selectAnswer: (score: number) => void;
}

function QuestionCard({
  question,
  currentQuestion,
  answers,
  selectAnswer,
}: QuestionCardProps) {
  return (
    <section className="question-card">
      <span className="question-category">
        {categoryEmoji[question.category] ?? "✨"} {question.category}
      </span>
      <h2 className="question-text">{question.question}</h2>
      <div className="options-list">
        {question.options.map((option, index) => (
          <OptionButton
            key={option.score}
            text={option.text}
            score={option.score}
            hotkey={index + 1}
            selected={answers[currentQuestion] === option.score}
            onClick={() => selectAnswer(option.score)}
          />
        ))}
      </div>
      <p className="question-hint">키보드 1~5로 선택, ← → 로 이동할 수 있어요</p>
    </section>
  );
}

export default QuestionCard;
