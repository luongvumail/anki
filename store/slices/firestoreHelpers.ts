import { collection, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

export function getUserId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

export function decksRef(uid: string) {
  return collection(db, 'users', uid, 'decks');
}

export function cardsRef(uid: string, deckId: string) {
  return collection(db, 'users', uid, 'decks', deckId, 'cards');
}

export function cardRef(uid: string, deckId: string, cardId: string) {
  return doc(db, 'users', uid, 'decks', deckId, 'cards', cardId);
}

export function userProgressRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'progress');
}

/**
 * Removes undefined properties from an object so Firestore setDoc/updateDoc calls don't crash.
 */
export function sanitizeForFirestore<T extends object>(obj: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  const record = obj as Record<string, unknown>;
  Object.keys(record).forEach((key) => {
    if (record[key] !== undefined) {
      clean[key] = record[key];
    }
  });
  return clean as Partial<T>;
}
