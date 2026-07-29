import type { SurveyQuestion } from "../../types/survey";
import OptionButton from "./OptionButton";
import { HelpTip } from "./SurveyHelp";

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
      <div className="question-card-top">
        <HelpTip />
      </div>
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
    </section>
  );
}

export default QuestionCard;
