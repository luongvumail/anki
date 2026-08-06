import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { CardEntity, ensureFSRSState } from "../../domain/card/cardEntity";
import { ICardRepository } from "../../domain/card/cardRepository.i";
import { DeckEntity } from "../../domain/deck/deckEntity";
import { IDeckRepository } from "../../domain/deck/deckRepository.i";
import { auth, db } from "../firebase/firebaseApp";

export class FirestoreCardRepository implements ICardRepository {
  private getUserId(): string | null {
    return auth.currentUser ? auth.currentUser.uid : null;
  }

  private getCollectionRef() {
    const uid = this.getUserId();
    if (!uid) {
      throw new Error("User is not authenticated");
    }
    return collection(db, "users", uid, "cards");
  }

  public async getCards(deckId?: string): Promise<CardEntity[]> {
    const uid = this.getUserId();
    let docs: import("firebase/firestore").QueryDocumentSnapshot[] = [];

    // Helper to query a collection reference safely
    const fetchFromCollection = async (
      colRef: import("firebase/firestore").CollectionReference,
      targetDeckId?: string,
    ) => {
      let fetchedDocs: import("firebase/firestore").QueryDocumentSnapshot[] = [];
      try {
        if (targetDeckId) {
          // 1. Exact deckId query
          try {
            const q = query(colRef, where("deckId", "==", targetDeckId));
            const snapshot = await getDocs(q);
            fetchedDocs = snapshot.docs;
          } catch {}

          // 2. Exact deck_id query
          if (fetchedDocs.length === 0) {
            try {
              const q = query(colRef, where("deck_id", "==", targetDeckId));
              const snapshot = await getDocs(q);
              fetchedDocs = snapshot.docs;
            } catch {}
          }

          // 3. Fallback: Fetch all in collection and filter locally
          if (fetchedDocs.length === 0) {
            const allSnapshot = await getDocs(query(colRef));
            fetchedDocs = allSnapshot.docs.filter((d) => {
              const data = d.data();
              const cardDeckId = data.deckId ?? data.deck_id ?? data.deckID ?? data.deck ?? "";
              if (!cardDeckId) return true; // If stored inside a deck-specific subcollection
              const target = String(targetDeckId).trim().toLowerCase();
              const actual = String(cardDeckId).trim().toLowerCase();
              return actual === target;
            });
          }
        } else {
          const snapshot = await getDocs(query(colRef));
          fetchedDocs = snapshot.docs;
        }
      } catch (err) {
        console.warn("[FirestoreCardRepository] Fetch from collection failed:", err);
      }
      return fetchedDocs;
    };

    // 1. Try primary location: users/{uid}/cards
    if (uid) {
      try {
        const userColRef = collection(db, "users", uid, "cards");
        docs = await fetchFromCollection(userColRef, deckId);
      } catch {}
    }

    // 2. Try secondary location: root collection "cards" if 0 docs found
    if (docs.length === 0) {
      try {
        const rootColRef = collection(db, "cards");
        docs = await fetchFromCollection(rootColRef, deckId);
      } catch {}
    }

    // 3. Try tertiary location: users/{uid}/decks/{deckId}/cards if 0 docs found
    if (docs.length === 0 && uid && deckId) {
      try {
        const userDeckCardsRef = collection(db, "users", uid, "decks", deckId, "cards");
        docs = await fetchFromCollection(userDeckCardsRef);
      } catch {}
    }

    // 4. Try quaternary location: root decks/{deckId}/cards if 0 docs found
    if (docs.length === 0 && deckId) {
      try {
        const rootDeckCardsRef = collection(db, "decks", deckId, "cards");
        docs = await fetchFromCollection(rootDeckCardsRef);
      } catch {}
    }

    const now = new Date();
    const result: CardEntity[] = [];
    const seenIds = new Set<string>();

    for (const docSnap of docs) {
      if (seenIds.has(docSnap.id)) continue;
      seenIds.add(docSnap.id);

      try {
        const data = docSnap.data() as Record<string, any>;
        const character =
          data.character ||
          data.hanzi ||
          data.word ||
          data.front ||
          data.chinese ||
          data.term ||
          "";
        const pinyin = data.pinyin || data.py || data.pronunciation || "";
        const translation =
          data.translation ||
          data.meaning ||
          data.back ||
          data.vietnamese ||
          data.definition ||
          data.vn ||
          "";

        const rawCard: CardEntity = {
          id: docSnap.id,
          deckId: data.deckId || data.deck_id || data.deckID || data.deck || deckId || "",
          character,
          traditional: data.traditional || data.trad,
          pinyin,
          hanviet: data.hanviet || data.han_viet || data.hv,
          translation,
          examples: Array.isArray(data.examples)
            ? data.examples
            : Array.isArray(data.sentences)
              ? data.sentences
              : [],
          radical: data.radical,
          strokeCount: data.strokeCount,
          hskLevel: data.hskLevel,
          tags: Array.isArray(data.tags) ? data.tags : [],
          srs: data.srs,
          fsrs: data.fsrs,
          createdAt: data.createdAt || now.toISOString(),
          updatedAt: data.updatedAt || now.toISOString(),
          lastReviewedAt: data.lastReviewedAt,
        };
        const fsrs = ensureFSRSState(rawCard, now);
        result.push({
          ...rawCard,
          fsrs,
        });
      } catch (docErr) {
        console.warn(`[FirestoreCardRepository] Failed to parse card ${docSnap.id}:`, docErr);
      }
    }

    return result;
  }

  public async getCardById(cardId: string): Promise<CardEntity | null> {
    const uid = this.getUserId();
    if (!uid) return null;
    const docRef = doc(db, "users", uid, "cards", cardId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data() as CardEntity;
    const rawCard = { ...data, id: snap.id };
    return {
      ...rawCard,
      fsrs: ensureFSRSState(rawCard),
    };
  }

  public async saveCard(card: CardEntity): Promise<void> {
    const uid = this.getUserId();
    if (!uid) throw new Error("User is not authenticated");
    const docRef = doc(db, "users", uid, "cards", card.id);
    const fsrs = ensureFSRSState(card);

    const payload: CardEntity = {
      ...card,
      fsrs,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
  }

  public async saveCards(cards: CardEntity[]): Promise<void> {
    const uid = this.getUserId();
    if (!uid || cards.length === 0) return;

    // Batch writes in chunks of 500 (Firestore limit)
    const CHUNK_SIZE = 450;
    for (let i = 0; i < cards.length; i += CHUNK_SIZE) {
      const chunk = cards.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      const nowStr = new Date().toISOString();

      for (const card of chunk) {
        const docRef = doc(db, "users", uid, "cards", card.id);
        const fsrs = ensureFSRSState(card);
        const payload: CardEntity = {
          ...card,
          fsrs,
          updatedAt: nowStr,
        };
        batch.set(docRef, payload, { merge: true });
      }

      await batch.commit();
    }
  }

  public async deleteCard(cardId: string): Promise<void> {
    const uid = this.getUserId();
    if (!uid) throw new Error("User is not authenticated");
    const docRef = doc(db, "users", uid, "cards", cardId);
    await deleteDoc(docRef);
  }
}

export class FirestoreDeckRepository implements IDeckRepository {
  private getUserId(): string | null {
    return auth.currentUser ? auth.currentUser.uid : null;
  }

  public async getDecks(): Promise<DeckEntity[]> {
    const uid = this.getUserId();
    if (!uid) return [];
    const colRef = collection(db, "users", uid, "decks");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<DeckEntity, "id">),
    }));
  }

  public async saveDeck(deck: DeckEntity): Promise<void> {
    const uid = this.getUserId();
    if (!uid) throw new Error("User is not authenticated");
    const docRef = doc(db, "users", uid, "decks", deck.id);
    await setDoc(docRef, deck, { merge: true });
  }

  public async deleteDeck(deckId: string): Promise<void> {
    const uid = this.getUserId();
    if (!uid) throw new Error("User is not authenticated");
    const docRef = doc(db, "users", uid, "decks", deckId);
    await deleteDoc(docRef);
  }
}
