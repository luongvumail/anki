import { SRSState } from "../../lib/srs";

export interface Card {
  id: string;
  deckId: string;
  character: string;
  traditional?: string;
  pinyin: string;
  hanviet?: string;
  translation: string;
  examples: { chinese: string; pinyin: string; vietnamese: string }[];
  radical?: string;
  strokeCount?: number;
  hskLevel?: number;
  tags?: string[];
  srs: SRSState;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  cardCount: number;
  newCount: number;
  dueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  deckId: string;
  queue: Card[];
  currentIndex: number;
  reviewedCount: number;
  correctCount: number;
  startTime: Date;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "vocab" | "speed" | "ai";
  target: number;
  current: number;
  unlocked: boolean;
}

export interface UserProgressState {
  xp: number;
  unlockedBadgeIds: string[];
  addXP: (amount: number) => void;
  checkAndUnlockBadges: () => void;
  fetchUserProgress: () => Promise<void>;
}
