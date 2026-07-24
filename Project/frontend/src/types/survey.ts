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
  completedAt: string;
}

export interface SurveySummaryResult {
  summary: string;
}

export interface RecommendationResult {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  tags: string[];
  compatibilityScore: number;
  age: number;
  job?: string | null;
  region?: string | null;
}

export interface SurveyComparisonHighlight {
  category: string;
  myAnswer: string;
  otherAnswer: string;
  difference: number;
  description: string;
}

export interface SurveyComparisonItem {
  questionId: number;
  category: string;
  myAnswer: string;
  otherAnswer: string;
  myScore: number;
  otherScore: number;
  difference: number;
  matchLevel: string;
}

export interface SurveyComparisonResult {
  userId: number;
  nickname: string;
  compatibilityScore: number;
  topReasons: SurveyComparisonHighlight[];
  differences: SurveyComparisonHighlight[];
  items: SurveyComparisonItem[];
}
