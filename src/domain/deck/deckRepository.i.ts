import { DeckEntity } from "./deckEntity";

export interface IDeckRepository {
  getDecks(): Promise<DeckEntity[]>;
  saveDeck(deck: DeckEntity): Promise<void>;
  deleteDeck(deckId: string): Promise<void>;
}
