import { create } from 'zustand';
import { GenerateAICardsInput, GenerateAICardsUseCase } from '../../application/usecases/GenerateAICards';
import { ProcessCardReviewUseCase } from '../../application/usecases/ProcessCardReview';
import { SyncOfflineQueueUseCase } from '../../application/usecases/SyncOfflineQueue';
import { CardEntity, ensureFSRSState } from '../../domain/card/cardEntity';
import { Rating, ReviewLog } from '../../domain/fsrs/fsrsTypes';
import { StreakState } from '../../domain/streak/streakCalculator';
import { GeminiService } from '../../infrastructure/ai/geminiService';
import { FirestoreCardRepository } from '../../infrastructure/persistence/firestoreRepo';
import { LocalStorageRepo, SyncOfflinePayload } from '../../infrastructure/persistence/localStorageRepo';

export interface AppStoreState {
  cards: Record<string, CardEntity[]>; // deckId -> cards
  streakState: StreakState;
  xp: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  processReview: (card: CardEntity, rating: Rating) => Promise<{ updatedCard: CardEntity; log: ReviewLog }>;
  syncOfflineQueue: () => Promise<void>;
  generateAICards: (input: GenerateAICardsInput) => Promise<CardEntity[]>;
  setCardsForDeck: (deckId: string, cards: CardEntity[]) => void;
}

const localRepo = new LocalStorageRepo();
const remoteRepo = new FirestoreCardRepository();
const geminiService = new GeminiService();
const reviewUseCase = new ProcessCardReviewUseCase();
const syncUseCase = new SyncOfflineQueueUseCase(localRepo, remoteRepo);
const aiUseCase = new GenerateAICardsUseCase(geminiService, remoteRepo);

export const useAppStore = create<AppStoreState>((set, get) => ({
  cards: {},
  streakState: { currentStreak: 0, longestStreak: 0, lastStudyDate: null },
  xp: 0,
  isLoading: false,
  error: null,

  setCardsForDeck: (deckId: string, cards: CardEntity[]) => {
    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: cards.map((c) => ({ ...c, fsrs: ensureFSRSState(c) })),
      },
    }));
  },

  processReview: async (card: CardEntity, rating: Rating) => {
    const now = new Date();
    const currentStreak = get().streakState;

    // Execute domain use-case
    const result = reviewUseCase.execute({
      card,
      rating,
      now,
      currentStreak,
    });

    const { updatedCard, reviewLog, earnedXP, newStreak } = result;

    // Optimistic UI update
    const deckId = card.deckId;
    const existingCards = get().cards[deckId] || [];
    const updatedCards = existingCards.map((c) => (c.id === card.id ? updatedCard : c));

    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedCards },
      xp: s.xp + earnedXP,
      streakState: newStreak || s.streakState,
    }));

    // Save offline or to Firestore
    try {
      await remoteRepo.saveCard(updatedCard);
    } catch {
      // Enqueue to offline queue if remote save fails
      const payload: SyncOfflinePayload = {
        id: `offline-${Date.now()}-${Math.random()}`,
        cardId: card.id,
        deckId: card.deckId,
        card: updatedCard,
        reviewLog,
        timestamp: now.toISOString(),
      };
      await localRepo.enqueueOfflineReview(payload);
    }

    return { updatedCard, log: reviewLog };
  },

  syncOfflineQueue: async () => {
    try {
      await syncUseCase.execute();
    } catch (err: any) {
      console.warn('[useAppStore] Sync failed:', err);
    }
  },

  generateAICards: async (input: GenerateAICardsInput) => {
    set({ isLoading: true, error: null });
    try {
      const createdCards = await aiUseCase.execute(input);
      const deckId = input.deckId;
      const existing = get().cards[deckId] || [];

      set((s) => ({
        cards: { ...s.cards, [deckId]: [...existing, ...createdCards] },
        isLoading: false,
      }));

      return createdCards;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to generate AI cards', isLoading: false });
      throw err;
    }
  },
}));
