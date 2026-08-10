import { CardEntity } from "../../domain/card/cardEntity.js";
import { ICardRepository } from "../../domain/card/cardRepository.i.js";

export interface UpdateCardInput {
  cardId: string;
  kanji?: string;
  pinyin?: string;
  meaning?: string;
  radicalAnalysis?: string;
  exampleSentence?: string;
  fsrsState?: CardEntity["fsrsState"];
}

export class UpdateCardUseCase {
  constructor(private readonly cardRepo: ICardRepository) {}

  async execute(input: UpdateCardInput): Promise<CardEntity> {
    const card = await this.cardRepo.getById(input.cardId);
    if (!card) {
      throw new Error(`Card with id ${input.cardId} not found`);
    }

    const updatedCard: CardEntity = {
      ...card,
      kanji: input.kanji ?? card.kanji,
      pinyin: input.pinyin ?? card.pinyin,
      meaning: input.meaning ?? card.meaning,
      radicalAnalysis: input.radicalAnalysis ?? card.radicalAnalysis,
      exampleSentence: input.exampleSentence ?? card.exampleSentence,
      fsrsState: input.fsrsState ?? card.fsrsState,
      updatedAt: new Date().toISOString(),
    };

    await this.cardRepo.save(updatedCard);
    return updatedCard;
  }
}
