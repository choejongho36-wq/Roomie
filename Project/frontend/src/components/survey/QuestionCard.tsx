import type { SurveyQuestion } from "../../types/survey";
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
      <span className="question-category">{question.category}</span>
      <h2 className="question-text">{question.question}</h2>
      <div className="options-list">
        {question.options.map((option) => (
          <OptionButton
            key={option.score}
            text={option.text}
            score={option.score}
            selected={answers[currentQuestion] === option.score}
            onClick={() => selectAnswer(option.score)}
          />
        ))}
      </div>
    </section>
  );
}

export default QuestionCard;
