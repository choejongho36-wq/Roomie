export interface MatchedPairPartnerInfo {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  region: string | null;
}

export interface MatchedPairExternalLinks {
  dabangMapUrl: string;
  naverSearchUrl: string;
  googleSearchUrl: string;
}

export interface MatchedPair {
  id: number;
  status: "SEARCHING" | "CONFIRMED";
  region: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: string | null;
  createdAt: string;
  me: MatchedPairPartnerInfo;
  partner: MatchedPairPartnerInfo;
  externalLinks: MatchedPairExternalLinks;
}