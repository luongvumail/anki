import { StateCreator } from "zustand";
import {
  GenerateAICardsInput,
  GenerateAICardsUseCase,
} from "../../../application/usecases/GenerateAICards";
import { ProcessCardReviewUseCase } from "../../../application/usecases/ProcessCardReview";
import { SyncOfflineQueueUseCase } from "../../../application/usecases/SyncOfflineQueue";
import { CardEntity, ensureFSRSState } from "../../../domain/card/cardEntity";
import { FSRSEngine } from "../../../domain/fsrs/fsrsEngine";
import { Rating, ReviewLog } from "../../../domain/fsrs/fsrsTypes";
import { GeminiService } from "../../../infrastructure/ai/geminiService";
import { FirestoreCardRepository } from "../../../infrastructure/persistence/firestoreRepo";
import {
  LocalStorageRepo,
  SyncOfflinePayload,
} from "../../../infrastructure/persistence/localStorageRepo";
import { ReviewTrackerRepository } from "../../../infrastructure/persistence/reviewTrackerRepo";
import { AppStoreState } from "../types";

const localRepo = new LocalStorageRepo();
const remoteRepo = new FirestoreCardRepository();
const reviewTrackerRepo = new ReviewTrackerRepository();
const geminiService = new GeminiService();
const fsrsEngine = new FSRSEngine();
const reviewUseCase = new ProcessCardReviewUseCase(fsrsEngine);
const syncUseCase = new SyncOfflineQueueUseCase(localRepo, remoteRepo);
const aiUseCase = new GenerateAICardsUseCase(geminiService, remoteRepo, fsrsEngine);

export interface CardSlice {
  cards: Record<string, CardEntity[]>;
  isCardLoading: boolean;
  cardError: string | null;

  fetchCards: (deckId: string) => Promise<CardEntity[]>;
  updateCard: (cardId: string, deckId: string, updates: Partial<CardEntity>) => Promise<void>;
  processReview: (
    card: CardEntity,
    rating: Rating,
  ) => Promise<{ updatedCard: CardEntity; log: ReviewLog }>;
  syncOfflineQueue: () => Promise<void>;
  generateAICards: (input: GenerateAICardsInput) => Promise<CardEntity[]>;
  setCardsForDeck: (deckId: string, cards: CardEntity[]) => void;
  addCard: (card: Omit<CardEntity, "id" | "createdAt" | "updatedAt">) => Promise<CardEntity>;
  deleteCard: (cardId: string, deckId: string) => Promise<void>;
  resetDeckProgress: (deckId: string) => Promise<void>;
}

function generateId(prefix: string): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const createCardSlice: StateCreator<AppStoreState, [], [], CardSlice> = (set, get) => ({
  cards: {},
  isCardLoading: false,
  cardError: null,

  fetchCards: async (deckId: string) => {
    set({ isCardLoading: true, cardError: null });
    try {
      const fetched = await remoteRepo.getCards(deckId);
      set((s) => ({
        cards: { ...s.cards, [deckId]: fetched },
        isCardLoading: false,
      }));
      return fetched;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch cards";
      set({ cardError: errorMessage, isCardLoading: false });
      return get().cards[deckId] || [];
    }
  },

  setCardsForDeck: (deckId: string, cards: CardEntity[]) => {
    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: cards.map((c) => ({ ...c, fsrs: ensureFSRSState(c) })),
      },
    }));
  },

  addCard: async (cardData: Omit<CardEntity, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date();
    const nowStr = now.toISOString();
    const initialFSRS = cardData.fsrs ?? fsrsEngine.createEmptyCard(now);

    const newCard: CardEntity = {
      ...cardData,
      id: generateId("card"),
      fsrs: initialFSRS,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    const deckId = cardData.deckId;
    const existing = get().cards[deckId] || [];
    set((s) => ({
      cards: { ...s.cards, [deckId]: [...existing, newCard] },
    }));
    try {
      await remoteRepo.saveCard(newCard);
    } catch (err) {
      console.warn("[cardSlice] Failed to save card remotely:", err);
    }
    return newCard;
  },

  updateCard: async (cardId: string, deckId: string, updates: Partial<CardEntity>) => {
    const existingCards = get().cards[deckId] || [];
    const targetCard = existingCards.find((c) => c.id === cardId);
    if (!targetCard) return;

    const updatedCard = { ...targetCard, ...updates, updatedAt: new Date().toISOString() };
    const updatedList = existingCards.map((c) => (c.id === cardId ? updatedCard : c));

    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedList },
    }));

    try {
      await remoteRepo.saveCard(updatedCard);
    } catch (err) {
      console.warn("[cardSlice] Failed to update card remotely:", err);
    }
  },

  deleteCard: async (cardId: string, deckId: string) => {
    const existingCards = get().cards[deckId] || [];
    const updatedList = existingCards.filter((c) => c.id !== cardId);

    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedList },
    }));

    try {
      await remoteRepo.deleteCard(cardId);
    } catch (err) {
      console.warn("[cardSlice] Failed to delete card remotely:", err);
    }
  },

  processReview: async (card: CardEntity, rating: Rating) => {
    const now = new Date();
    const currentStreak = get().streakState;

    const result = reviewUseCase.execute({
      card,
      rating,
      now,
      currentStreak,
    });

    const { updatedCard, reviewLog, earnedXP, newStreak } = result;

    const deckId = card.deckId;
    const existingCards = get().cards[deckId] || [];
    const updatedCards = existingCards.map((c) => (c.id === card.id ? updatedCard : c));

    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedCards },
      xp: (s.xp || 0) + earnedXP,
      streakState: newStreak || s.streakState,
    }));

    await reviewTrackerRepo.recordReviewToday();

    try {
      await remoteRepo.saveCard(updatedCard);
    } catch {
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
    } catch (err: unknown) {
      console.warn("[cardSlice] Sync failed:", err);
    }
  },

  generateAICards: async (input: GenerateAICardsInput) => {
    set({ isCardLoading: true, cardError: null });
    try {
      const createdCards = await aiUseCase.execute(input);
      const deckId = input.deckId;
      const existing = get().cards[deckId] || [];

      set((s) => ({
        cards: { ...s.cards, [deckId]: [...existing, ...createdCards] },
        isCardLoading: false,
      }));

      return createdCards;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate AI cards";
      set({ cardError: errorMessage, isCardLoading: false });
      throw err;
    }
  },

  resetDeckProgress: async (deckId: string) => {
    const existingCards = get().cards[deckId] || [];
    const now = new Date();
    const nowStr = now.toISOString();

    const resetCards = existingCards.map((c) => ({
      ...c,
      fsrs: fsrsEngine.createEmptyCard(now),
      srs: undefined,
      updatedAt: nowStr,
    }));

    set((s) => ({
      cards: { ...s.cards, [deckId]: resetCards },
    }));

    try {
      await remoteRepo.saveCards(resetCards);
    } catch (err) {
      console.warn("[cardSlice] Failed to reset deck progress remotely:", err);
    }
  },
});
