import { DeckEntity } from "./deckEntity.js";

export interface IDeckRepository {
  getAll(): Promise<DeckEntity[]>;
  getById(id: string): Promise<DeckEntity | null>;
  save(deck: DeckEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
