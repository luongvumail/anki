import { CardEntity } from "./cardEntity.js";

export interface ICardRepository {
  getAll(): Promise<CardEntity[]>;
  getByDeckId(deckId: string): Promise<CardEntity[]>;
  getById(id: string): Promise<CardEntity | null>;
  save(card: CardEntity): Promise<void>;
  saveBatch(cards: CardEntity[]): Promise<void>;
  delete(id: string): Promise<void>;
}
