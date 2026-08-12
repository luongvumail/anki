import { StateCreator } from "zustand";
import {
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { createDefaultSRSState, SRSGrade, calculateSRS } from "../../lib/srs";
import { Card } from "./types";
import { getUserId, cardsRef, cardRef, decksRef, sanitizeForFirestore } from "./firestoreHelpers";
import { UISlice } from "./uiSlice";
import { DeckSlice } from "./deckSlice";
import { computeDueCount, computeNewCount } from "../../lib/deckUtils";

import { recordReviewToday } from "../../lib/reviewTracker";
import { getFirestoreErrorMessage } from "../../lib/errorHandler";
import { APP_CONFIG } from "../../constants/config";

export const PAGE_SIZE = APP_CONFIG.PAGE_SIZE;
const FIRESTORE_BATCH_SIZE = 500;

function fireAndForget(actionName: string, asyncFn: () => Promise<void>): void {
  asyncFn().catch((err) => {
    console.error(`[cardSlice:${actionName}] Firestore async sync failed:`, err);
  });
}

export interface CardSlice {
  cards: Record<string, Card[]>; // deckId → cards
  hasMoreCards: Record<string, boolean>; // deckId → boolean
  isFetchingMoreCards: Record<string, boolean>; // deckId → boolean
  lastDocSnapshots: Record<string, QueryDocumentSnapshot | null>; // deckId → last snapshot
  fetchCards: (deckId: string) => Promise<Card[]>;
  fetchMoreCards: (deckId: string) => Promise<void>;
  fetchAllCardsForStats: (deckId: string) => Promise<void>;
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
      // Fetch ALL cards with no limit — ensures accurate cardCount, dueCount, newCount always.
      const q = query(cardsRef(uid, deckId), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const fetchedCards = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Card);
      const totalCount = fetchedCards.length;
      const totalDue = computeDueCount(fetchedCards);
      const totalNew = computeNewCount(fetchedCards);

      set((s) => ({
        cards: { ...s.cards, [deckId]: fetchedCards },
        // Mark no more pages since we fetched everything
        hasMoreCards: { ...s.hasMoreCards, [deckId]: false },
        lastDocSnapshots: { ...s.lastDocSnapshots, [deckId]: null },
        decks: s.decks.map((d) =>
          d.id === deckId
            ? { ...d, cardCount: totalCount, dueCount: totalDue, newCount: totalNew }
            : d,
        ),
        isLoading: false,
      }));

      // Persist corrected counts back to Firestore so they're accurate next session too.
      fireAndForget("fetchCards:syncCounts", async () => {
        const deckDocRef = doc(decksRef(uid), deckId);
        await updateDoc(deckDocRef, {
          cardCount: totalCount,
          dueCount: totalDue,
          newCount: totalNew,
        });
      });

      return fetchedCards;
    } catch (e: unknown) {
      const msg = getFirestoreErrorMessage(e);
      set({ error: msg, isLoading: false });
      return [];
    }
  },

  // No-op: pagination removed. fetchCards now loads everything in one query.
  fetchAllCardsForStats: async (_deckId) => {},

  // No-op: pagination removed. All cards are loaded by fetchCards.
  fetchMoreCards: async (_deckId) => {},

  addCard: async (cardData) => {
    const uid = getUserId();
    const existingCards = get().cards[cardData.deckId] || [];
    const cleanChar = cardData.character.trim().toLowerCase();

    // Prevent duplicate cards: if card already exists in this deck, update it instead of creating duplicate
    const duplicate = existingCards.find(
      (c) => c.character.trim().toLowerCase() === cleanChar,
    );

    if (duplicate) {
      if (__DEV__) {
        console.log(
          `[cardSlice] Duplicate found for "${cardData.character}" in deck ${cardData.deckId}. Updating card ${duplicate.id} instead of creating duplicate.`,
        );
      }
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
    const realDueCount = computeDueCount(updatedCards);
    const realNewCount = computeNewCount(updatedCards);

    // Optimistically update local store immediately.
    // cardCount: increment by 1 from the deck's stored count (which reflects total, including unloaded pages).
    // dueCount/newCount: computed from loaded cards — best approximation when paginated.
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

    // Async background persistence to Firestore
    fireAndForget("addCard", async () => {
      await setDoc(ref, sanitizeForFirestore(card));
      // Read the current deck count from Firestore and increment to avoid race conditions
      const deckDocRef = doc(decksRef(uid), cardData.deckId);
      const currentDeck = get().decks.find((d) => d.id === cardData.deckId);
      await updateDoc(deckDocRef, {
        cardCount: currentDeck ? currentDeck.cardCount : updatedCards.length,
        dueCount: realDueCount,
        newCount: realNewCount,
      });
    });
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
    fireAndForget("updateCard", async () => {
      const cleanUpdates = sanitizeForFirestore({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(cardRef(uid, deckId, cardId), cleanUpdates);
    });
  },

  deleteCard: async (cardId, deckId) => {
    const uid = getUserId();
    const existingCards = get().cards[deckId] || [];
    const updatedCards = existingCards.filter((c) => c.id !== cardId);
    const realDueCount = computeDueCount(updatedCards);
    const realNewCount = computeNewCount(updatedCards);

    // Optimistically update local store immediately.
    // cardCount: decrement by 1 from stored total (accurate even when paginated).
    set((s) => ({
      cards: {
        ...s.cards,
        [deckId]: updatedCards,
      },
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

    // Async background persistence to Firestore
    fireAndForget("deleteCard", async () => {
      await deleteDoc(cardRef(uid, deckId, cardId));
      const deckDocRef = doc(decksRef(uid), deckId);
      const currentDeck = get().decks.find((d) => d.id === deckId);
      await updateDoc(deckDocRef, {
        cardCount: currentDeck ? currentDeck.cardCount : updatedCards.length,
        dueCount: realDueCount,
        newCount: realNewCount,
      });
    });
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

    // Perform batched bulk deletion in Firestore (max 500 items per batch)
    fireAndForget("clearDeckCards", async () => {
      for (let i = 0; i < existingCards.length; i += FIRESTORE_BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = existingCards.slice(i, i + FIRESTORE_BATCH_SIZE);
        chunk.forEach((c) => batch.delete(cardRef(uid, deckId, c.id)));
        await batch.commit();
      }
      const deckDocRef = doc(decksRef(uid), deckId);
      await updateDoc(deckDocRef, {
        cardCount: 0,
        dueCount: 0,
        newCount: 0,
      });
    });
  },

  gradeCard: async (card, grade) => {
    const newSRS = calculateSRS(grade, card.srs);
    const now = new Date().toISOString();
    await get().updateCard(card.id, card.deckId, { srs: newSRS, lastReviewedAt: now });
    await recordReviewToday();
  },

  resetDeckProgress: async (deckId) => {
    const uid = getUserId();
    const existingCards = get().cards[deckId] || [];
    const now = new Date().toISOString();
    const cardCount = existingCards.length;

    // Optimistically update local store immediately
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

    // Async background persistence to Firestore using local cards (no re-fetching getDocs)
    fireAndForget("resetDeckProgress", async () => {
      const defaultSRS = createDefaultSRSState();
      for (let i = 0; i < existingCards.length; i += FIRESTORE_BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = existingCards.slice(i, i + FIRESTORE_BATCH_SIZE);
        chunk.forEach((c) =>
          batch.update(cardRef(uid, deckId, c.id), { srs: defaultSRS, updatedAt: now }),
        );
        await batch.commit();
      }

      const deckDocRef = doc(decksRef(uid), deckId);
      await updateDoc(deckDocRef, {
        dueCount: cardCount,
        newCount: cardCount,
        updatedAt: now,
      });
    });
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

