import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { CardEntity, ensureFSRSState } from '../../domain/card/cardEntity';
import { ICardRepository } from '../../domain/card/cardRepository.i';
import { auth, db } from '../../../lib/firebase';

export class FirestoreCardRepository implements ICardRepository {
  private getUserId(): string | null {
    return auth.currentUser ? auth.currentUser.uid : null;
  }

  private getCollectionRef() {
    const uid = this.getUserId();
    if (!uid) {
      throw new Error('User is not authenticated');
    }
    return collection(db, 'users', uid, 'cards');
  }

  public async getCards(deckId?: string): Promise<CardEntity[]> {
    const colRef = this.getCollectionRef();
    let q = query(colRef);
    if (deckId) {
      q = query(colRef, where('deckId', '==', deckId));
    }

    const snapshot = await getDocs(q);
    const now = new Date();

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as CardEntity;
      const rawCard: CardEntity = {
        ...data,
        id: docSnap.id,
      };
      // Auto-migrate SM-2 cards to FSRS state on read
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
    const docRef = doc(db, 'users', uid, 'cards', cardId);
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
    if (!uid) throw new Error('User is not authenticated');
    const docRef = doc(db, 'users', uid, 'cards', card.id);
    const fsrs = ensureFSRSState(card);

    const payload: CardEntity = {
      ...card,
      fsrs,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
  }

  public async saveCards(cards: CardEntity[]): Promise<void> {
    for (const card of cards) {
      await this.saveCard(card);
    }
  }

  public async deleteCard(cardId: string): Promise<void> {
    const uid = this.getUserId();
    if (!uid) throw new Error('User is not authenticated');
    const docRef = doc(db, 'users', uid, 'cards', cardId);
    await deleteDoc(docRef);
  }
}
