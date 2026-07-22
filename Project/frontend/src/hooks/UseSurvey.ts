import { useState } from "react";

export const useSurvey = (totalQuestions: number) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const selectAnswer = (score: number) => {
    const updated = [...answers];
    updated[currentQuestion] = score;
    setAnswers(updated);
  };

  const nextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  return {
    currentQuestion,
    answers,
    selectAnswer,
    nextQuestion,
    previousQuestion,
  };
};