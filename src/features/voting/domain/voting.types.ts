export type ElectionStatus = "ACTIVE" | "UPCOMING" | "PAST";

export interface Candidate {
  id: string;
  name: string;
  manifesto: string;
  positionId: string;
  imageUrl?: string;
  photo?: string;
  avatar?: string;
  displayOrder?: number;
}

export interface Position {
  id: string;
  title: string;
  description?: string;
  minChoices: number;
  maxChoices: number;
  candidates: Candidate[];
}

export interface Election {
  id: string;
  title: string;
  status: ElectionStatus;
  description: string;
  category: 'guild' | 'club' | 'council' | 'faculty' | 'poll';
  imageUrl?: string;
  coverImage?: string;
  candidates: Candidate[]; // Legacy or convenience
  positions: Position[]; // The backend uses positions
  endTime?: string;
  startTime?: string;
  totalEligibleVoters?: number;
}

export interface VoterRegistrationPayload {
  studentId: string;
  faculty: string;
  yearOfStudy: number;
}

export interface VoteSelection {
  positionId: string;
  candidateIds: string[];
  abstain?: boolean;
  none?: boolean;
}

export interface SubmitVotePayload {
  electionId: string;
  selections: VoteSelection[];
  // voterHash: string; // Removed as per latest backend spec
}

export interface VoteReceipt {
  userId: string;
  electionId: string;
  selection: VoteSelection[];
  createdAt: string;
  confirmationCode: string;
}

export interface UserProfile {
  isRegistered: boolean;
  points: number;
  badges: string[];
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName?: string;
  authorImageUrl?: string;
  content: string;
  type: string;
  createdAt: string;
}

export interface SubmitVoteResponse {
  confirmationCode: string;
  pointsEarned: number;
  badgeUnlocked: boolean;
  totalPoints: number;
}
