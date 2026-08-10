import { DeckEntity } from "../../../domain/deck/deckEntity.js";
import { container } from "../../../infrastructure/container.js";
import { DeckSliceState } from "../types.js";

const DEFAULT_HSK1_DECK: DeckEntity = {
  id: "deck_hsk1",
  title: "Tiếng Trung HSK 1 Core",
  description: "150 từ vựng căn bản HSK 1 với ví dụ & Pinyin chuẩn",
  color: "#059669",
  cardCount: 10,
  newCardCount: 8,
  reviewCardCount: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const createDeckSlice = (
  set: (fn: (state: DeckSliceState) => Partial<DeckSliceState>) => void,
): DeckSliceState => ({
  decks: [],
  isDeckLoading: false,
  deckError: null,

  loadDecks: async () => {
    set(() => ({ isDeckLoading: true, deckError: null }));
    try {
      const fetched = await container.deckRepo.getAll();
      set(() => ({ decks: fetched, isDeckLoading: false }));
      return fetched;
    } catch (e: any) {
      set(() => ({ isDeckLoading: false, deckError: e.message }));
      return [];
    }
  },

  addDeck: async (title: string, description: string, color = "#059669") => {
    const newDeck: DeckEntity = {
      id: `deck_${Date.now()}`,
      title,
      description,
      color,
      cardCount: 0,
      newCardCount: 0,
      reviewCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await container.deckRepo.save(newDeck);
    set((prev) => ({ decks: [...prev.decks, newDeck] }));
    return newDeck;
  },

  deleteDeck: async (deckId: string) => {
    await container.deckRepo.delete(deckId);
    set((prev) => ({ decks: prev.decks.filter((d) => d.id !== deckId) }));
  },
});
