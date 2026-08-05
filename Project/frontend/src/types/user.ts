export interface User {
  userId: number;
  email: string;
  nickname: string;
  gender: string;
  birthDate: string;
  region: string | null;
  job: string | null;
  smoking: string | null;
  smokingType: string | null;
  createdAt: string;
  profileImageUrl: string | null;
  tags: string[];
  bio: string | null;
  provider: string;
  emailVerified: boolean;
  isAdmin: boolean;
  needsAdditionalInfo: boolean;
  linkedProviders: string[];
}