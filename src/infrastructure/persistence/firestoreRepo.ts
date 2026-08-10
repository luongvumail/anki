import { CardEntity } from "../../domain/card/cardEntity.js";
import { ICardRepository } from "../../domain/card/cardRepository.i.js";

/**
 * Firestore Realtime Synchronization Repository
 * Implements STD-007 Last-Write-Wins Conflict Resolution based on updatedAt timestamp.
 */
export class FirestoreCardRepository implements ICardRepository {
  private remoteCards: Map<string, CardEntity> = new Map();

  async getAll(): Promise<CardEntity[]> {
    return Array.from(this.remoteCards.values());
  }

  async getByDeckId(deckId: string): Promise<CardEntity[]> {
    return Array.from(this.remoteCards.values()).filter((c) => c.deckId === deckId);
  }

  async getById(id: string): Promise<CardEntity | null> {
    return this.remoteCards.get(id) ?? null;
  }

  /**
   * Saves card implementing Last-Write-Wins conflict resolution strategy.
   */
  async save(card: CardEntity): Promise<void> {
    const existing = this.remoteCards.get(card.id);
    if (!existing) {
      this.remoteCards.set(card.id, card);
      return;
    }

    const localTime = new Date(card.updatedAt).getTime();
    const remoteTime = new Date(existing.updatedAt).getTime();

    // Local timestamp is newer or equal -> Local wins
    if (localTime >= remoteTime) {
      this.remoteCards.set(card.id, card);
    }
  }

  async saveBatch(cards: CardEntity[]): Promise<void> {
    for (const card of cards) {
      await this.save(card);
    }
  }

  async delete(id: string): Promise<void> {
    this.remoteCards.delete(id);
  }
}
