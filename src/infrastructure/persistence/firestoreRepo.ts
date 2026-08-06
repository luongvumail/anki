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
    if (!uid) return [];
    const colRef = this.getCollectionRef();
    let q = query(colRef);
    if (deckId) {
      q = query(colRef, where("deckId", "==", deckId));
    }

    const snapshot = await getDocs(q);
    const now = new Date();

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as CardEntity;
      const rawCard: CardEntity = {
        ...data,
        id: docSnap.id,
      };
      const fsrs = ensureFSRSState(rawCard, now);
      return {
        ...rawCard,
        fsrs,
      };
    });
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
