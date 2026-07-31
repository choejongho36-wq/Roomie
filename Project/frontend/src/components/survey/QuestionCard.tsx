import type { SurveyQuestion } from "../../types/survey";
import OptionButton from "./OptionButton";
import { HelpTip } from "./SurveyHelp";
import roomieLogo from "../../assets/Roomie_logo.png";
import { useAuth } from "../../context/AuthContext";

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
  const { user } = useAuth();
  const name = user?.nickname ?? "회원";
  // 문구에 "{name}"이 들어있으면 로그인한 사용자 닉네임으로 바꿔치기한다
  const situationLines = question.situation
    ? (Array.isArray(question.situation) ? question.situation : [question.situation]).map((line) =>
        line.replace("{name}", name)
      )
    : [];
  const questionText = question.question.replace("{name}", name);

  return (
    <section className="question-card">
      <div className="question-card-top">
        <span className="question-category">{question.category}</span>
        <HelpTip />
      </div>
      <div className="question-bubble-row">
        <img src={roomieLogo} alt="Roomie" className="question-avatar" />
        <div className="question-bubble-col">
          {situationLines.map((line, index) => (
            <p key={index} className="question-situation-text">
              {line}
            </p>
          ))}
          <h2 className="question-bubble-text">{questionText}</h2>
        </div>
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
