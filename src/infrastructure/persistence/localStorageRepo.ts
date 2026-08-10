import { CardEntity } from "../../domain/card/cardEntity.js";
import { ICardRepository } from "../../domain/card/cardRepository.i.js";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { IDeckRepository } from "../../domain/deck/deckRepository.i.js";

const CARDS_STORAGE_KEY = "@anki_cards_v1";
const DECKS_STORAGE_KEY = "@anki_decks_v1";

function getItem<T>(key: string): T | null {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  return null;
}

function setItem<T>(key: string, value: T): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export class LocalStorageCardRepository implements ICardRepository {
  private cards: Map<string, CardEntity> = new Map();

  constructor(initialCards: CardEntity[] = []) {
    const persisted = getItem<CardEntity[]>(CARDS_STORAGE_KEY);
    if (persisted && Array.isArray(persisted)) {
      for (const card of persisted) {
        this.cards.set(card.id, card);
      }
    } else {
      for (const card of initialCards) {
        this.cards.set(card.id, card);
      }
      this.persist();
    }
  }

  private persist() {
    setItem(CARDS_STORAGE_KEY, Array.from(this.cards.values()));
  }

  async getAll(): Promise<CardEntity[]> {
    return Array.from(this.cards.values());
  }

  async getByDeckId(deckId: string): Promise<CardEntity[]> {
    return Array.from(this.cards.values()).filter((c) => c.deckId === deckId);
  }

  async getById(id: string): Promise<CardEntity | null> {
    return this.cards.get(id) ?? null;
  }

  async save(card: CardEntity): Promise<void> {
    this.cards.set(card.id, card);
    this.persist();
  }

  async saveBatch(cards: CardEntity[]): Promise<void> {
    for (const card of cards) {
      this.cards.set(card.id, card);
    }
    this.persist();
  }

  async delete(id: string): Promise<void> {
    this.cards.delete(id);
    this.persist();
  }
}

export class LocalStorageDeckRepository implements IDeckRepository {
  private decks: Map<string, DeckEntity> = new Map();

  constructor(initialDecks: DeckEntity[] = []) {
    const persisted = getItem<DeckEntity[]>(DECKS_STORAGE_KEY);
    if (persisted && Array.isArray(persisted)) {
      for (const deck of persisted) {
        this.decks.set(deck.id, deck);
      }
    } else {
      for (const deck of initialDecks) {
        this.decks.set(deck.id, deck);
      }
      this.persist();
    }
  }

  private persist() {
    setItem(DECKS_STORAGE_KEY, Array.from(this.decks.values()));
  }

  async getAll(): Promise<DeckEntity[]> {
    return Array.from(this.decks.values());
  }

  async getById(id: string): Promise<DeckEntity | null> {
    return this.decks.get(id) ?? null;
  }

  async save(deck: DeckEntity): Promise<void> {
    this.decks.set(deck.id, deck);
    this.persist();
  }

  async delete(id: string): Promise<void> {
    this.decks.delete(id);
    this.persist();
  }
}
