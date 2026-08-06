import AsyncStorage from "@react-native-async-storage/async-storage";
import { CardEntity } from "../../domain/card/cardEntity";
import { ReviewLog } from "../../domain/fsrs/fsrsTypes";

export interface SyncOfflinePayload {
  id: string;
  cardId: string;
  deckId: string;
  card: CardEntity;
  reviewLog: ReviewLog;
  timestamp: string;
}

const OFFLINE_QUEUE_KEY = "@anki_offline_review_queue_v1";
const CARDS_CACHE_KEY = "@anki_cards_cache_v1";

export class LocalStorageRepo {
  /**
   * Retrieves all pending review payloads from local storage queue.
   */
  public async getOfflineQueue(): Promise<SyncOfflinePayload[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!data) return [];
      return JSON.parse(data) as SyncOfflinePayload[];
    } catch {
      return [];
    }
  }

  /**
   * Pushes a new offline review to local storage queue.
   */
  public async enqueueOfflineReview(payload: SyncOfflinePayload): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.push(payload);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Removes synced items from queue.
   */
  public async removeOfflineReviews(syncedIds: string[]): Promise<void> {
    const queue = await this.getOfflineQueue();
    const filtered = queue.filter((item) => !syncedIds.includes(item.id));
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  }

  /**
   * Clears entire offline queue.
   */
  public async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  /**
   * Caches cards array locally for offline access.
   */
  public async saveCachedCards(cards: CardEntity[]): Promise<void> {
    await AsyncStorage.setItem(CARDS_CACHE_KEY, JSON.stringify(cards));
  }

  /**
   * Retrieves locally cached cards.
   */
  public async getCachedCards(): Promise<CardEntity[]> {
    try {
      const data = await AsyncStorage.getItem(CARDS_CACHE_KEY);
      if (!data) return [];
      return JSON.parse(data) as CardEntity[];
    } catch {
      return [];
    }
  }

  /**
   * Caches cards for a specific deck locally.
   */
  public async saveCachedCardsForDeck(deckId: string, cards: CardEntity[]): Promise<void> {
    try {
      const key = `@anki_deck_cards_cache_${deckId}`;
      await AsyncStorage.setItem(key, JSON.stringify(cards));
    } catch (err) {
      console.warn("[LocalStorageRepo] Failed to cache cards for deck:", err);
    }
  }

  /**
   * Retrieves locally cached cards for a specific deck.
   */
  public async getCachedCardsForDeck(deckId: string): Promise<CardEntity[]> {
    try {
      const key = `@anki_deck_cards_cache_${deckId}`;
      const data = await AsyncStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data) as CardEntity[];
    } catch {
      return [];
    }
  }
}
