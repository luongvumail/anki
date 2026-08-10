import { ICardRepository } from "../../domain/card/cardRepository.i.js";
import { IDeckRepository } from "../../domain/deck/deckRepository.i.js";
import { FSRSEngine } from "../../domain/fsrs/fsrsEngine.js";

export class ResetDeckProgressUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
    private readonly fsrsEngine: FSRSEngine
  ) {}

  async execute(deckId: string): Promise<void> {
    const cards = await this.cardRepo.getByDeckId(deckId);
    const nowIso = new Date().toISOString();

    for (const card of cards) {
      card.fsrsState = this.fsrsEngine.createNewCardState();
      card.updatedAt = nowIso;
      await this.cardRepo.save(card);
    }

    const deck = await this.deckRepo.getById(deckId);
    if (deck) {
      deck.newCardCount = cards.length;
      deck.reviewCardCount = 0;
      deck.updatedAt = nowIso;
      await this.deckRepo.save(deck);
    }
  }
}
