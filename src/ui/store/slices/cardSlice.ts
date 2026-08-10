import { CardEntity } from "../../../domain/card/cardEntity.js";
import { Rating, ReviewLog } from "../../../domain/fsrs/fsrsTypes.js";
import { container } from "../../../infrastructure/container.js";
import { reviewTrackerRepo } from "../../../infrastructure/persistence/reviewTrackerRepo.js";
import { CardSliceState } from "../types.js";

export const createCardSlice = (
  set: (fn: (state: CardSliceState) => Partial<CardSliceState>) => void,
  get: () => CardSliceState,
): CardSliceState => ({
  cards: {},
  isCardLoading: false,
  cardError: null,

  fetchCards: async (deckId: string) => {
    set(() => ({ isCardLoading: true, cardError: null }));
    try {
      const fetchedCards = await container.cardRepo.getByDeckId(deckId);
      set((prev) => ({
        cards: { ...prev.cards, [deckId]: fetchedCards },
        isCardLoading: false,
      }));
      return fetchedCards;
    } catch (e: any) {
      set(() => ({ isCardLoading: false, cardError: e.message }));
      return [];
    }
  },

  addCard: async (cardData) => {
    const newCard = await container.addCard.execute(cardData);
    const existing = get().cards[cardData.deckId] || [];
    set((prev) => ({
      cards: { ...prev.cards, [cardData.deckId]: [...existing, newCard] },
    }));
    return newCard;
  },

  updateCard: async (cardId, deckId, updates) => {
    const updatedCard = await container.updateCard.execute({ cardId, ...updates });
    const existing = get().cards[deckId] || [];
    const updatedList = existing.map((c) => (c.id === cardId ? updatedCard : c));
    set((prev) => ({
      cards: { ...prev.cards, [deckId]: updatedList },
    }));
  },

  deleteCard: async (cardId, deckId) => {
    await container.deleteCard.execute(cardId);
    const existing = get().cards[deckId] || [];
    const filtered = existing.filter((c) => c.id !== cardId);
    set((prev) => ({
      cards: { ...prev.cards, [deckId]: filtered },
    }));
  },

  resetDeckProgress: async (deckId) => {
    const existing = get().cards[deckId] || [];
    const now = new Date().toISOString();
    const updatedCards: CardEntity[] = [];

    for (const card of existing) {
      const resetFsrs = {
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        state: 0,
        last_review: null,
        due: now,
      };
      const updated = await container.updateCard.execute({
        cardId: card.id,
        fsrsState: resetFsrs,
      });
      updatedCards.push(updated);
    }

    set((prev) => ({
      cards: { ...prev.cards, [deckId]: updatedCards },
    }));
  },

  processReview: async (card: CardEntity, rating: Rating) => {
    const result = await container.processCardReview.execute({
      cardId: card.id,
      rating,
    });

    await reviewTrackerRepo.logReview(new Date().toISOString(), result.xpEarned);

    const deckId = card.deckId;
    const existing = get().cards[deckId] || [];
    const updatedCards = existing.map((c) => (c.id === card.id ? result.updatedCard : c));

    set((prev) => ({
      cards: { ...prev.cards, [deckId]: updatedCards },
    }));

    const dummyLog: ReviewLog = {
      rating,
      state: result.updatedCard.fsrsState.state,
      due: result.updatedCard.fsrsState.due,
      stability: result.updatedCard.fsrsState.stability,
      difficulty: result.updatedCard.fsrsState.difficulty,
      elapsed_days: 0,
      scheduled_days: 0,
      review: new Date().toISOString(),
    };

    return { updatedCard: result.updatedCard, log: dummyLog };
  },
});
