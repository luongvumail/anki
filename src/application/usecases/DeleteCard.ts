import { ICardRepository } from "../../domain/card/cardRepository.i.js";
import { IDeckRepository } from "../../domain/deck/deckRepository.i.js";

export class DeleteCardUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
  ) {}

  async execute(cardId: string): Promise<void> {
    const card = await this.cardRepo.getById(cardId);
    if (!card) return;

    await this.cardRepo.delete(cardId);

    const deck = await this.deckRepo.getById(card.deckId);
    if (deck) {
      deck.cardCount = Math.max(0, deck.cardCount - 1);
      deck.updatedAt = new Date().toISOString();
      await this.deckRepo.save(deck);
    }
  }
}
