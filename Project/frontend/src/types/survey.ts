export interface SurveyOption {
    score: number;
    text: string;
  }
  
  export interface SurveyQuestion {
    id: number;
    category: string;
    question: string;
    options: SurveyOption[];
  }

export interface SurveyResult {
  id: number;
  answers: number[];
  totalScore: number;
  completedAt: string;
}