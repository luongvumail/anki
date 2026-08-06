import { StateCreator } from "zustand";
import { AddCardUseCase } from "../../../application/usecases/AddCard";
import { DeleteCardUseCase } from "../../../application/usecases/DeleteCard";
import {
  GenerateAICardsInput,
  GenerateAICardsUseCase,
} from "../../../application/usecases/GenerateAICards";
import { ProcessCardReviewUseCase } from "../../../application/usecases/ProcessCardReview";
import { ResetDeckProgressUseCase } from "../../../application/usecases/ResetDeckProgress";
import { SyncOfflineQueueUseCase } from "../../../application/usecases/SyncOfflineQueue";
import { UpdateCardUseCase } from "../../../application/usecases/UpdateCard";
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
const addCardUseCase = new AddCardUseCase(remoteRepo, fsrsEngine);
const updateCardUseCase = new UpdateCardUseCase(remoteRepo);
const deleteCardUseCase = new DeleteCardUseCase(remoteRepo);
const resetDeckUseCase = new ResetDeckProgressUseCase(remoteRepo, fsrsEngine);

export interface CardSlice {
  cards: Record<string, CardEntity[]>;
  hasFetchedCards: Record<string, boolean>;
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
  hasFetchedCards: {},
  isCardLoading: false,
  cardError: null,

  fetchCards: async (deckId: string) => {
    set({ isCardLoading: true, cardError: null });

    let initialCards = get().cards[deckId] || [];
    if (initialCards.length === 0) {
      try {
        const cached = await localRepo.getCachedCardsForDeck(deckId);
        if (cached && cached.length > 0) {
          initialCards = cached;
          set((s) => ({
            cards: { ...s.cards, [deckId]: cached },
            hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
          }));
        }
      } catch (err) {
        console.warn("[cardSlice] Local cache read error:", err);
      }
    }

    try {
      const fetched = await remoteRepo.getCards(deckId);

      let finalCards = fetched;
      if (fetched.length === 0 && initialCards.length > 0) {
        finalCards = initialCards;
      } else if (fetched.length > 0 && initialCards.length > 0) {
        const map = new Map<string, CardEntity>();
        initialCards.forEach((c) => map.set(c.id, c));
        fetched.forEach((c) => map.set(c.id, c));
        finalCards = Array.from(map.values());
      }

      set((s) => ({
        cards: { ...s.cards, [deckId]: finalCards },
        hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
        isCardLoading: false,
      }));

      if (finalCards.length > 0) {
        localRepo.saveCachedCardsForDeck(deckId, finalCards).catch(() => {});
      }

      return finalCards;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch cards";
      set((s) => ({
        cards: { ...s.cards, [deckId]: initialCards },
        hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
        cardError: errorMessage,
        isCardLoading: false,
      }));
      return initialCards;
    }
  },

  setCardsForDeck: (deckId: string, cards: CardEntity[]) => {
    const formatted = cards.map((c) => ({ ...c, fsrs: ensureFSRSState(c) }));
    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: formatted,
      },
      hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
    }));
    localRepo.saveCachedCardsForDeck(deckId, formatted).catch(() => {});
  },

  addCard: async (cardData: Omit<CardEntity, "id" | "createdAt" | "updatedAt">) => {
    let newCard: CardEntity;
    try {
      newCard = await addCardUseCase.execute(cardData);
    } catch (err) {
      console.warn("[cardSlice] AddCardUseCase remote save warning:", err);
      const nowStr = new Date().toISOString();
      newCard = {
        ...cardData,
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: nowStr,
        updatedAt: nowStr,
      };
    }

    const deckId = cardData.deckId;
    const existing = get().cards[deckId] || [];
    const updatedList = [...existing, newCard];
    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedList },
      hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
    }));
    localRepo.saveCachedCardsForDeck(deckId, updatedList).catch(() => {});
    return newCard;
  },

  updateCard: async (cardId: string, deckId: string, updates: Partial<CardEntity>) => {
    const existingCards = get().cards[deckId] || [];
    const targetCard = existingCards.find((c) => c.id === cardId);
    if (!targetCard) return;

    let updatedCard: CardEntity;
    try {
      updatedCard = await updateCardUseCase.execute({ targetCard, updates });
    } catch (err) {
      console.warn("[cardSlice] UpdateCardUseCase remote save warning:", err);
      updatedCard = { ...targetCard, ...updates, updatedAt: new Date().toISOString() };
    }

    const updatedList = existingCards.map((c) => (c.id === cardId ? updatedCard : c));
    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedList },
      hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
    }));
    localRepo.saveCachedCardsForDeck(deckId, updatedList).catch(() => {});
  },

  deleteCard: async (cardId: string, deckId: string) => {
    const existingCards = get().cards[deckId] || [];
    const updatedList = existingCards.filter((c) => c.id !== cardId);

    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedList },
      hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
    }));
    localRepo.saveCachedCardsForDeck(deckId, updatedList).catch(() => {});

    try {
      await deleteCardUseCase.execute(cardId);
    } catch (err) {
      console.warn("[cardSlice] DeleteCardUseCase remote delete warning:", err);
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
      hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
      xp: (s.xp || 0) + earnedXP,
      streakState: newStreak || s.streakState,
    }));
    localRepo.saveCachedCardsForDeck(deckId, updatedCards).catch(() => {});

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
      const updatedList = [...existing, ...createdCards];

      set((s) => ({
        cards: { ...s.cards, [deckId]: updatedList },
        hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
        isCardLoading: false,
      }));
      localRepo.saveCachedCardsForDeck(deckId, updatedList).catch(() => {});

      return createdCards;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate AI cards";
      set({ cardError: errorMessage, isCardLoading: false });
      throw err;
    }
  },

  resetDeckProgress: async (deckId: string) => {
    const existingCards = get().cards[deckId] || [];
    let resetCards: CardEntity[];
    try {
      resetCards = await resetDeckUseCase.execute(existingCards);
    } catch (err) {
      console.warn("[cardSlice] ResetDeckProgressUseCase remote save warning:", err);
      const now = new Date();
      const nowStr = now.toISOString();
      resetCards = existingCards.map((c) => ({
        ...c,
        fsrs: fsrsEngine.createEmptyCard(now),
        srs: undefined,
        updatedAt: nowStr,
      }));
    }

    set((s) => ({
      cards: { ...s.cards, [deckId]: resetCards },
      hasFetchedCards: { ...s.hasFetchedCards, [deckId]: true },
    }));
    localRepo.saveCachedCardsForDeck(deckId, resetCards).catch(() => {});
  },
});
