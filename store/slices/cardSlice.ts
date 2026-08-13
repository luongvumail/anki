import { StateCreator } from "zustand";
import { supabase } from "../../lib/supabase";
import { createDefaultFSRSState } from "../../lib/srs";
import { Card } from "./types";
import { UISlice } from "./uiSlice";
import { DeckSlice } from "./deckSlice";
import { computeDueCount, computeNewCount } from "../../lib/deckUtils";
import { getDatabaseErrorMessage } from "../../lib/errorHandler";
import { APP_CONFIG } from "../../constants/config";

export const PAGE_SIZE = APP_CONFIG.PAGE_SIZE;

// Helper to map DB row (snake_case) to Card model (camelCase)
export function mapRowToCard(row: any): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    character: row.character,
    traditional: row.traditional || undefined,
    pinyin: row.pinyin,
    hanviet: row.hanviet || undefined,
    translation: row.translation,
    examples: Array.isArray(row.examples) ? row.examples : [],
    radical: row.radical || undefined,
    strokeCount: row.stroke_count ?? undefined,
    hskLevel: row.hsk_level ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    srs: row.srs || createDefaultFSRSState(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastReviewedAt: row.last_reviewed_at || undefined,
  };
}

export interface CardSlice {
  cards: Record<string, Card[]>; // deckId → cards
  hasMoreCards: Record<string, boolean>; // deckId → boolean
  isFetchingMoreCards: Record<string, boolean>; // deckId → boolean
  fetchCards: (deckId: string) => Promise<Card[]>;
  fetchDueCards: (deckId: string) => Promise<Card[]>;
  fetchMoreCards: (deckId: string) => Promise<void>;
  fetchAllCardsForStats: (deckId: string) => Promise<void>;
  addCard: (card: Omit<Card, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCard: (cardId: string, deckId: string, updates: Partial<Card>) => Promise<void>;
  batchUpdateCards: (
    items: { cardId: string; deckId: string; updates: Partial<Card> }[],
  ) => Promise<void>;
  deleteCard: (cardId: string, deckId: string) => Promise<void>;
  clearDeckCards: (deckId: string) => Promise<void>;
  resetDeckProgress: (deckId: string) => Promise<void>;
  findExistingCard: (character: string, deckId?: string) => Card | undefined;
}

export const createCardSlice: StateCreator<CardSlice & UISlice & DeckSlice, [], [], CardSlice> = (
  set,
  get,
) => ({
  cards: {},
  hasMoreCards: {},
  isFetchingMoreCards: {},

  fetchCards: async (deckId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const fetchedCards = (data || []).map(mapRowToCard);

      set((s) => ({
        cards: { ...s.cards, [deckId]: fetchedCards },
        hasMoreCards: { ...s.hasMoreCards, [deckId]: false },
        isLoading: false,
      }));

      return fetchedCards;
    } catch (e: unknown) {
      const msg = getDatabaseErrorMessage(e);
      set({ error: msg, isLoading: false });
      return [];
    }
  },

  fetchDueCards: async (deckId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const nowStr = new Date().toISOString();
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("deck_id", deckId)
        .lte("srs_next_review", nowStr)
        .order("srs_next_review", { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data || []).map(mapRowToCard);
    } catch (e: unknown) {
      console.warn("[fetchDueCards] Failed to fetch due cards:", e);
      return [];
    }
  },

  fetchAllCardsForStats: async (_deckId) => {},
  fetchMoreCards: async (_deckId) => {},

  addCard: async (cardData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const existingCards = get().cards[cardData.deckId] || [];
    const cleanChar = cardData.character.trim().toLowerCase();

    const duplicate = existingCards.find((c) => c.character.trim().toLowerCase() === cleanChar);
    if (duplicate) {
      await get().updateCard(duplicate.id, cardData.deckId, {
        character: cardData.character,
        traditional: cardData.traditional,
        pinyin: cardData.pinyin,
        hanviet: cardData.hanviet,
        translation: cardData.translation,
        examples: cardData.examples || [],
        radical: cardData.radical,
        strokeCount: cardData.strokeCount,
        hskLevel: cardData.hskLevel,
        tags: cardData.tags || [],
      });
      return;
    }

    const defaultFSRS = cardData.srs || createDefaultFSRSState();
    const nextReview = defaultFSRS.dueDate || new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from("cards")
        .insert({
          deck_id: cardData.deckId,
          user_id: user.id,
          character: cardData.character,
          traditional: cardData.traditional,
          pinyin: cardData.pinyin,
          hanviet: cardData.hanviet,
          translation: cardData.translation,
          examples: cardData.examples || [],
          radical: cardData.radical,
          stroke_count: cardData.strokeCount,
          hsk_level: cardData.hskLevel,
          tags: cardData.tags || [],
          srs: defaultFSRS,
          srs_next_review: nextReview,
        })
        .select()
        .single();

      if (error) throw error;

      const newCard = mapRowToCard(data);
      const updatedCards = [newCard, ...existingCards];
      const realDueCount = computeDueCount(updatedCards);
      const realNewCount = computeNewCount(updatedCards);

      set((s) => ({
        cards: { ...s.cards, [cardData.deckId]: updatedCards },
        decks: s.decks.map((deck) =>
          deck.id === cardData.deckId
            ? {
                ...deck,
                cardCount: (deck.cardCount || 0) + 1,
                dueCount: realDueCount,
                newCount: realNewCount,
              }
            : deck,
        ),
      }));
    } catch (err) {
      console.error("[addCard] Supabase insert failed:", err);
      throw err;
    }
  },

  updateCard: async (cardId, deckId, updates) => {
    const existing = get().cards[deckId] || [];
    const updatedCards = existing.map((c) => (c.id === cardId ? { ...c, ...updates } : c));
    const realDueCount = computeDueCount(updatedCards);
    const realNewCount = computeNewCount(updatedCards);

    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedCards },
      decks: s.decks.map((d) =>
        d.id === deckId ? { ...d, dueCount: realDueCount, newCount: realNewCount } : d,
      ),
    }));

    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.character !== undefined) payload.character = updates.character;
      if (updates.traditional !== undefined) payload.traditional = updates.traditional;
      if (updates.pinyin !== undefined) payload.pinyin = updates.pinyin;
      if (updates.hanviet !== undefined) payload.hanviet = updates.hanviet;
      if (updates.translation !== undefined) payload.translation = updates.translation;
      if (updates.examples !== undefined) payload.examples = updates.examples;
      if (updates.radical !== undefined) payload.radical = updates.radical;
      if (updates.strokeCount !== undefined) payload.stroke_count = updates.strokeCount;
      if (updates.hskLevel !== undefined) payload.hsk_level = updates.hskLevel;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.srs !== undefined) {
        payload.srs = updates.srs;
        if (updates.srs.dueDate) {
          payload.srs_next_review = updates.srs.dueDate;
        }
      }
      if (updates.lastReviewedAt !== undefined) payload.last_reviewed_at = updates.lastReviewedAt;

      const { error } = await supabase.from("cards").update(payload).eq("id", cardId);
      if (error) throw error;
    } catch (err) {
      console.error("[updateCard] Supabase update failed:", err);
    }
  },

  batchUpdateCards: async (items) => {
    if (items.length === 0) return;

    const state = get();
    const newCardsState = { ...state.cards };
    const updatedDeckIds = new Set<string>();

    for (const { cardId, deckId, updates } of items) {
      updatedDeckIds.add(deckId);
      const existing = newCardsState[deckId] || [];
      newCardsState[deckId] = existing.map((c) => (c.id === cardId ? { ...c, ...updates } : c));
    }

    const updatedDecks = state.decks.map((d) => {
      if (updatedDeckIds.has(d.id)) {
        const deckCards = newCardsState[d.id] || [];
        return {
          ...d,
          dueCount: computeDueCount(deckCards),
          newCount: computeNewCount(deckCards),
        };
      }
      return d;
    });

    set({ cards: newCardsState, decks: updatedDecks });

    try {
      await Promise.all(
        items.map(async ({ cardId, updates }) => {
          const payload: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          if (updates.character !== undefined) payload.character = updates.character;
          if (updates.traditional !== undefined) payload.traditional = updates.traditional;
          if (updates.pinyin !== undefined) payload.pinyin = updates.pinyin;
          if (updates.hanviet !== undefined) payload.hanviet = updates.hanviet;
          if (updates.translation !== undefined) payload.translation = updates.translation;
          if (updates.examples !== undefined) payload.examples = updates.examples;
          if (updates.radical !== undefined) payload.radical = updates.radical;
          if (updates.strokeCount !== undefined) payload.stroke_count = updates.strokeCount;
          if (updates.hskLevel !== undefined) payload.hsk_level = updates.hskLevel;
          if (updates.tags !== undefined) payload.tags = updates.tags;
          if (updates.srs !== undefined) {
            payload.srs = updates.srs;
            if (updates.srs.dueDate) {
              payload.srs_next_review = updates.srs.dueDate;
            }
          }
          if (updates.lastReviewedAt !== undefined)
            payload.last_reviewed_at = updates.lastReviewedAt;

          return supabase.from("cards").update(payload).eq("id", cardId);
        }),
      );
    } catch (err) {
      console.error("[batchUpdateCards] Supabase batch update failed:", err);
    }
  },

  deleteCard: async (cardId, deckId) => {
    const existingCards = get().cards[deckId] || [];
    const updatedCards = existingCards.filter((c) => c.id !== cardId);
    const realDueCount = computeDueCount(updatedCards);
    const realNewCount = computeNewCount(updatedCards);

    set((s) => ({
      cards: { ...s.cards, [deckId]: updatedCards },
      decks: s.decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cardCount: Math.max(0, (d.cardCount || 1) - 1),
              dueCount: realDueCount,
              newCount: realNewCount,
            }
          : d,
      ),
    }));

    try {
      const { error } = await supabase.from("cards").delete().eq("id", cardId);
      if (error) throw error;
    } catch (err) {
      console.error("[deleteCard] Supabase delete failed:", err);
    }
  },

  clearDeckCards: async (deckId) => {
    set((s) => ({
      cards: { ...s.cards, [deckId]: [] },
      decks: s.decks.map((deck) =>
        deck.id === deckId ? { ...deck, cardCount: 0, dueCount: 0, newCount: 0 } : deck,
      ),
    }));

    try {
      const { error } = await supabase.from("cards").delete().eq("deck_id", deckId);
      if (error) throw error;
    } catch (err) {
      console.error("[clearDeckCards] Supabase delete failed:", err);
    }
  },

  resetDeckProgress: async (deckId) => {
    const existingCards = get().cards[deckId] || [];
    const now = new Date().toISOString();
    const defaultFSRS = createDefaultFSRSState();
    const cardCount = existingCards.length;

    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: (s.cards[deckId] || []).map((c) => ({
          ...c,
          srs: defaultFSRS,
          updatedAt: now,
        })),
      },
      decks: s.decks.map((d) =>
        d.id === deckId ? { ...d, dueCount: cardCount, newCount: cardCount, updatedAt: now } : d,
      ),
    }));

    try {
      const { error } = await supabase
        .from("cards")
        .update({
          srs: defaultFSRS,
          srs_next_review: defaultFSRS.dueDate || now,
          updated_at: now,
        })
        .eq("deck_id", deckId);

      if (error) throw error;
    } catch (err) {
      console.error("[resetDeckProgress] Supabase update failed:", err);
    }
  },

  findExistingCard: (character, deckId) => {
    const q = character.trim().toLowerCase();
    if (!q) return undefined;
    const cardsState = get().cards;
    if (deckId && cardsState[deckId]) {
      return cardsState[deckId].find(
        (c) => c.character.trim().toLowerCase() === q || c.pinyin.trim().toLowerCase() === q,
      );
    }
    for (const dId of Object.keys(cardsState)) {
      const match = cardsState[dId].find(
        (c) => c.character.trim().toLowerCase() === q || c.pinyin.trim().toLowerCase() === q,
      );
      if (match) return match;
    }
    return undefined;
  },
});
