import { StateCreator } from "zustand";
import {
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth } from "../../lib/firebase";
import { createDefaultSRSState, SRSGrade, calculateSRS } from "../../lib/srs";
import { Card } from "./types";
import { getUserId, cardsRef, cardRef, decksRef } from "./firestoreHelpers";
import { UISlice } from "./uiSlice";
import { DeckSlice } from "./deckSlice";
import { computeDueCount, computeNewCount } from "../../lib/deckUtils";

import { recordReviewToday } from "../../lib/reviewTracker";

export const PAGE_SIZE = 20;

export interface CardSlice {
  cards: Record<string, Card[]>; // deckId → cards
  hasMoreCards: Record<string, boolean>; // deckId → boolean
  isFetchingMoreCards: Record<string, boolean>; // deckId → boolean
  lastDocSnapshots: Record<string, QueryDocumentSnapshot | null>; // deckId → last snapshot
  fetchCards: (deckId: string) => Promise<Card[]>;
  fetchMoreCards: (deckId: string) => Promise<void>;
  addCard: (card: Omit<Card, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCard: (cardId: string, deckId: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string, deckId: string) => Promise<void>;
  clearDeckCards: (deckId: string) => Promise<void>;
  gradeCard: (card: Card, grade: SRSGrade) => Promise<void>;
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
  lastDocSnapshots: {},
  fetchCards: async (deckId) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    set({ isLoading: true });
    try {
      // First page query with limit
      const q = query(cardsRef(uid, deckId), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      const snap = await getDocs(q);

      const fetchedCards = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Card);
      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const hasMore = snap.docs.length >= PAGE_SIZE;

      const realCardCount = fetchedCards.length;
      const realDueCount = computeDueCount(fetchedCards);
      const realNewCount = computeNewCount(fetchedCards);

      set((s) => ({
        cards: { ...s.cards, [deckId]: fetchedCards },
        lastDocSnapshots: { ...s.lastDocSnapshots, [deckId]: lastDoc },
        hasMoreCards: { ...s.hasMoreCards, [deckId]: hasMore },
        decks: s.decks.map((d) =>
          d.id === deckId
            ? {
                ...d,
                cardCount: Math.max(d.cardCount, realCardCount),
                dueCount: realDueCount,
                newCount: realNewCount,
              }
            : d,
        ),
        isLoading: false,
      }));

      return fetchedCards;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      return [];
    }
  },

  fetchMoreCards: async (deckId) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const state = get();
    const hasMore = state.hasMoreCards[deckId];
    const isFetching = state.isFetchingMoreCards[deckId];
    const lastDoc = state.lastDocSnapshots[deckId];

    if (!hasMore || isFetching || !lastDoc) return;

    set((s) => ({
      isFetchingMoreCards: { ...s.isFetchingMoreCards, [deckId]: true },
    }));

    try {
      const q = query(
        cardsRef(uid, deckId),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE),
      );
      const snap = await getDocs(q);

      const newCards = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Card);
      const nextLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const nextHasMore = snap.docs.length >= PAGE_SIZE;

      const existingCards = state.cards[deckId] || [];
      const combinedCards = [...existingCards, ...newCards];

      set((s) => ({
        cards: { ...s.cards, [deckId]: combinedCards },
        lastDocSnapshots: { ...s.lastDocSnapshots, [deckId]: nextLastDoc },
        hasMoreCards: { ...s.hasMoreCards, [deckId]: nextHasMore },
        isFetchingMoreCards: { ...s.isFetchingMoreCards, [deckId]: false },
      }));
    } catch (err: any) {
      console.warn("[fetchMoreCards] Failed to fetch more cards:", err);
      set((s) => ({
        isFetchingMoreCards: { ...s.isFetchingMoreCards, [deckId]: false },
      }));
    }
  },

  addCard: async (cardData) => {
    const uid = getUserId();
    const existingCards = get().cards[cardData.deckId] || [];
    const cleanChar = cardData.character.trim().toLowerCase();

    // Prevent duplicate cards: if card already exists in this deck, update it instead of creating duplicate
    const duplicate = existingCards.find(
      (c) => c.character.trim().toLowerCase() === cleanChar,
    );

    if (duplicate) {
      console.log(
        `[cardSlice] Duplicate found for "${cardData.character}" in deck ${cardData.deckId}. Updating card ${duplicate.id} instead of creating duplicate.`,
      );
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

    const ref = doc(cardsRef(uid, cardData.deckId));
    const card: Card = {
      id: ref.id,
      ...cardData,
      srs: cardData.srs || createDefaultSRSState(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCards = [card, ...existingCards];
    const realCardCount = updatedCards.length;
    const realDueCount = computeDueCount(updatedCards);
    const realNewCount = computeNewCount(updatedCards);

    // Optimistically update local store immediately
    set((s) => ({
      cards: { ...s.cards, [cardData.deckId]: updatedCards },
      decks: s.decks.map((deck) =>
        deck.id === cardData.deckId
          ? {
              ...deck,
              cardCount: realCardCount,
              dueCount: realDueCount,
              newCount: realNewCount,
            }
          : deck,
      ),
    }));

    // Async background persistence to Firestore
    (async () => {
      try {
        await setDoc(ref, card);
        const deckDocRef = doc(decksRef(uid), cardData.deckId);
        await updateDoc(deckDocRef, {
          cardCount: realCardCount,
          dueCount: realDueCount,
          newCount: realNewCount,
        });
      } catch (err) {
        console.error("[addCard] Firestore async sync failed:", err);
      }
    })();
  },

  updateCard: async (cardId, deckId, updates) => {
    const uid = getUserId();
    const existing = get().cards[deckId] || [];
    const updatedCards = existing.map((c) => (c.id === cardId ? { ...c, ...updates } : c));
    const realDueCount = computeDueCount(updatedCards);
    const realNewCount = computeNewCount(updatedCards);

    // Optimistically update local store immediately
    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: updatedCards,
      },
      decks: s.decks.map((d) =>
        d.id === deckId ? { ...d, dueCount: realDueCount, newCount: realNewCount } : d,
      ),
    }));

    // Async background persistence to Firestore
    (async () => {
      try {
        await updateDoc(cardRef(uid, deckId, cardId), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[updateCard] Firestore async sync failed:", err);
      }
    })();
  },

  deleteCard: async (cardId, deckId) => {
    const uid = getUserId();
    const existingCards = get().cards[deckId] || [];
    const updatedCards = existingCards.filter((c) => c.id !== cardId);
    const realCardCount = updatedCards.length;
    const realDueCount = computeDueCount(updatedCards);
    const realNewCount = computeNewCount(updatedCards);

    // Optimistically update local store immediately
    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: updatedCards,
      },
      decks: s.decks.map((d) =>
        d.id === deckId
          ? { ...d, cardCount: realCardCount, dueCount: realDueCount, newCount: realNewCount }
          : d,
      ),
    }));

    // Async background persistence to Firestore
    (async () => {
      try {
        await deleteDoc(cardRef(uid, deckId, cardId));
        const deckDocRef = doc(decksRef(uid), deckId);
        await updateDoc(deckDocRef, {
          cardCount: realCardCount,
          dueCount: realDueCount,
          newCount: realNewCount,
        });
      } catch (err) {
        console.error("[deleteCard] Firestore async sync failed:", err);
      }
    })();
  },

  clearDeckCards: async (deckId) => {
    const uid = getUserId();
    const existingCards = get().cards[deckId] || [];
    if (existingCards.length === 0) return;

    // Immediately update Zustand store in 1 single atomic state update
    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: [],
      },
      decks: s.decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cardCount: 0,
              dueCount: 0,
              newCount: 0,
            }
          : deck,
      ),
    }));

    // Perform parallel bulk deletion in Firestore
    try {
      await Promise.all(existingCards.map((c) => deleteDoc(cardRef(uid, deckId, c.id))));
      const deckDocRef = doc(decksRef(uid), deckId);
      await updateDoc(deckDocRef, {
        cardCount: 0,
        dueCount: 0,
        newCount: 0,
      });
    } catch (e: any) {
      console.warn("[clearDeckCards] Firestore bulk delete warning:", e);
    }
  },

  gradeCard: async (card, grade) => {
    const newSRS = calculateSRS(grade, card.srs);
    const now = new Date().toISOString();
    await get().updateCard(card.id, card.deckId, { srs: newSRS, lastReviewedAt: now });
    await recordReviewToday();
  },

  resetDeckProgress: async (deckId) => {
    const uid = getUserId();
    const snap = await getDocs(cardsRef(uid, deckId));
    const now = new Date().toISOString();
    const resets = snap.docs.map((d) =>
      updateDoc(d.ref, { srs: createDefaultSRSState(), updatedAt: now }),
    );
    await Promise.all(resets);

    const cardCount = snap.docs.length;
    const deckDocRef = doc(decksRef(uid), deckId);
    await updateDoc(deckDocRef, {
      dueCount: cardCount,
      newCount: cardCount,
      updatedAt: now,
    });

    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: (s.cards[deckId] || []).map((c) => ({
          ...c,
          srs: createDefaultSRSState(),
          updatedAt: now,
        })),
      },
      decks: s.decks.map((d) =>
        d.id === deckId ? { ...d, dueCount: cardCount, newCount: cardCount, updatedAt: now } : d,
      ),
    }));
  },

  findExistingCard: (character, deckId) => {
    const q = character.trim().toLowerCase();
    if (!q) return undefined;
    const cardsState = get().cards;
    // When deckId is provided, ONLY search within that deck (prevent false-positives across decks)
    if (deckId && cardsState[deckId]) {
      return cardsState[deckId].find(
        (c) => c.character.trim().toLowerCase() === q || c.pinyin.trim().toLowerCase() === q,
      );
    }
    // No deckId specified: search across all decks
    for (const dId of Object.keys(cardsState)) {
      const match = cardsState[dId].find(
        (c) => c.character.trim().toLowerCase() === q || c.pinyin.trim().toLowerCase() === q,
      );
      if (match) return match;
    }
    return undefined;
  },
});
