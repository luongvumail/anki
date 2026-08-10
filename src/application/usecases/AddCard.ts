import { CardEntity } from "../../domain/card/cardEntity.js";
import { ICardRepository } from "../../domain/card/cardRepository.i.js";
import { IDeckRepository } from "../../domain/deck/deckRepository.i.js";
import { FSRSEngine } from "../../domain/fsrs/fsrsEngine.js";

export interface AddCardInput {
  deckId: string;
  kanji: string;
  pinyin: string;
  meaning: string;
  radicalAnalysis?: string;
  exampleSentence?: string;
  hskLevel?: number;
}

export class AddCardUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
    private readonly fsrsEngine: FSRSEngine,
  ) {}

  async execute(input: AddCardInput): Promise<CardEntity> {
    const deck = await this.deckRepo.getById(input.deckId);
    if (!deck) {
      throw new Error(`Deck with id ${input.deckId} not found`);
    }

    const nowIso = new Date().toISOString();
    const newCardState = this.fsrsEngine.createNewCardState();

    const card: CardEntity = {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deckId: input.deckId,
      kanji: input.kanji,
      pinyin: input.pinyin,
      meaning: input.meaning,
      radicalAnalysis: input.radicalAnalysis,
      exampleSentence: input.exampleSentence,
      hskLevel: input.hskLevel,
      fsrsState: newCardState,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await this.cardRepo.save(card);

    // Update deck card count
    deck.cardCount += 1;
    deck.newCardCount += 1;
    deck.updatedAt = nowIso;
    await this.deckRepo.save(deck);

    return card;
  }
}
