export interface SurveyOption {
    score: number;
    text: string;
  }
  
  export interface SurveyQuestion {
    id: number;
    category: string;
    situation?: string | string[];
    question: string;
    options: SurveyOption[];
    defaultWeight: 1 | 2 | 3; // 1=낮음, 2=보통, 3=높음 — backend CompatibilityCalculator.DEFAULT_WEIGHTS와 동일하게 유지
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
  smoking?: string | null;
  smokingType?: string | null;
  emailVerified: boolean;
  // 설문 "희망 월세" 응답이 가리키는 구간(만원). 전세·년세이거나 설문 응답이 없으면 둘 다 null.
  desiredRentMin?: number | null;
  desiredRentMax?: number | null;
}

export interface SurveyComparisonHighlight {
  category: string;
  myAnswer: string;
  otherAnswer: string;
  difference: number;
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

export interface SurveyComparisonExplanationResult {
  explanation: string;
}
