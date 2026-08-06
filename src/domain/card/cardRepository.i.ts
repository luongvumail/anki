import { CardEntity } from "./cardEntity";

export interface ICardRepository {
  getCards(deckId?: string): Promise<CardEntity[]>;
  getCardById(cardId: string): Promise<CardEntity | null>;
  saveCard(card: CardEntity): Promise<void>;
  saveCards(cards: CardEntity[]): Promise<void>;
  deleteCard(cardId: string): Promise<void>;
}
