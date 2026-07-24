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
