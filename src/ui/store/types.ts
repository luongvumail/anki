import { CardEntity } from "../../domain/card/cardEntity.js";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { Rating, ReviewLog } from "../../domain/fsrs/fsrsTypes.js";
import { StreakState } from "../../domain/streak/streakCalculator.js";
import { UserProgress } from "../../domain/user/userProgress.js";

export interface CardSliceState {
  cards: Record<string, CardEntity[]>;
  isCardLoading: boolean;
  cardError: string | null;
  fetchCards: (deckId: string) => Promise<CardEntity[]>;
  addCard: (cardData: Omit<CardEntity, "id" | "createdAt" | "updatedAt">) => Promise<CardEntity>;
  updateCard: (cardId: string, deckId: string, updates: Partial<CardEntity>) => Promise<void>;
  deleteCard: (cardId: string, deckId: string) => Promise<void>;
  resetDeckProgress: (deckId: string) => Promise<void>;
  processReview: (
    card: CardEntity,
    rating: Rating,
  ) => Promise<{ updatedCard: CardEntity; log: ReviewLog }>;
}

export interface DeckSliceState {
  decks: DeckEntity[];
  isDeckLoading: boolean;
  deckError: string | null;
  loadDecks: () => Promise<DeckEntity[]>;
  addDeck: (title: string, description: string, color?: string) => Promise<DeckEntity>;
  deleteDeck: (deckId: string) => Promise<void>;
}

export interface ProgressSliceState {
  userProgress: UserProgress;
  streakState: StreakState;
  addXp: (amount: number) => void;
  updateStreak: (date?: Date) => void;
}

export interface UISliceState {
  isAIModalOpen: boolean;
  openAIModal: () => void;
  closeAIModal: () => void;
}

export type AppStoreState = CardSliceState & DeckSliceState & ProgressSliceState & UISliceState;
