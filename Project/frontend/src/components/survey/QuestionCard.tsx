import type { SurveyQuestion } from "../../types/survey";
import OptionButton from "./OptionButton";
import { HelpTip } from "./SurveyHelp";
import roomieLogo from "../../assets/Roomie_logo.png";

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
        <span className="question-category">{question.category}</span>
        <HelpTip />
      </div>
      <div className="question-bubble-row">
        <img src={roomieLogo} alt="Roomie" className="question-avatar" />
        <h2 className="question-bubble-text">{question.question}</h2>
      </div>
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
