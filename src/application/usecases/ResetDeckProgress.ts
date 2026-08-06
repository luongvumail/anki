import { CardEntity } from "../../domain/card/cardEntity";
import { ICardRepository } from "../../domain/card/cardRepository.i";
import { FSRSEngine } from "../../domain/fsrs/fsrsEngine";

export class ResetDeckProgressUseCase {
  private cardRepo: ICardRepository;
  private fsrsEngine: FSRSEngine;

  constructor(cardRepo: ICardRepository, fsrsEngine: FSRSEngine = new FSRSEngine()) {
    this.cardRepo = cardRepo;
    this.fsrsEngine = fsrsEngine;
  }

  public async execute(cards: CardEntity[]): Promise<CardEntity[]> {
    const now = new Date();
    const nowStr = now.toISOString();

    const resetCards: CardEntity[] = cards.map((c) => ({
      ...c,
      fsrs: this.fsrsEngine.createEmptyCard(now),
      srs: undefined,
      updatedAt: nowStr,
    }));

    await this.cardRepo.saveCards(resetCards);
    return resetCards;
  }
}
