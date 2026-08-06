import { StateCreator } from "zustand";
import { DeckEntity } from "../../../domain/deck/deckEntity";
import { FirestoreDeckRepository } from "../../../infrastructure/persistence/firestoreRepo";
import { AppStoreState } from "../types";

const deckRepo = new FirestoreDeckRepository();

export interface DeckSlice {
  decks: DeckEntity[];
  isDeckLoading: boolean;
  deckError: string | null;

  fetchDecks: () => Promise<void>;
  createDeck: (
    deckData: Omit<
      DeckEntity,
      "id" | "cardCount" | "newCount" | "dueCount" | "createdAt" | "updatedAt"
    >,
  ) => Promise<string>;
  deleteDeck: (deckId: string) => Promise<void>;
}

function generateId(prefix: string): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const createDeckSlice: StateCreator<AppStoreState, [], [], DeckSlice> = (set, get) => ({
  decks: [],
  isDeckLoading: false,
  deckError: null,

  fetchDecks: async () => {
    set({ isDeckLoading: true, deckError: null });
    try {
      const fetchedDecks = await deckRepo.getDecks();
      set({ decks: fetchedDecks, isDeckLoading: false });
      const fetchCardsFn = get().fetchCards;
      if (typeof fetchCardsFn === "function") {
        Promise.all(fetchedDecks.map((d) => fetchCardsFn(d.id))).catch((err) =>
          console.warn("[deckSlice] Card pre-fetch error:", err),
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch decks";
      set({ deckError: errorMessage, isDeckLoading: false });
    }
  },

  createDeck: async (deckData) => {
    const newDeck: DeckEntity = {
      id: generateId("deck"),
      ...deckData,
      cardCount: 0,
      newCount: 0,
      dueCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ decks: [...s.decks, newDeck] }));
    try {
      await deckRepo.saveDeck(newDeck);
    } catch (err) {
      console.warn("[deckSlice] Failed to save deck remotely:", err);
    }
    return newDeck.id;
  },

  deleteDeck: async (deckId: string) => {
    set((s) => ({
      decks: s.decks.filter((d) => d.id !== deckId),
      cards: s.cards
        ? Object.fromEntries(Object.entries(s.cards).filter(([k]) => k !== deckId))
        : s.cards,
    }));
    try {
      await deckRepo.deleteDeck(deckId);
    } catch (err) {
      console.warn("[deckSlice] Failed to delete deck remotely:", err);
    }
  },
});
