export interface MatchedPairPartnerInfo {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  region: string | null;
}

export interface MatchedPair {
  id: number;
  status: "SEARCHING" | "CONFIRMED";
  region: string | null;
  depositMax: number | null;
  monthlyRentMax: number | null;
  createdAt: string;
  me: MatchedPairPartnerInfo;
  partner: MatchedPairPartnerInfo;
  dabangMapUrl: string;
  myConfirmed: boolean;
  partnerConfirmed: boolean;
}