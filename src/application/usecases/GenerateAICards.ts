import { CardEntity } from "../../domain/card/cardEntity.js";
import { ICardRepository } from "../../domain/card/cardRepository.i.js";
import { IDeckRepository } from "../../domain/deck/deckRepository.i.js";
import { FSRSEngine } from "../../domain/fsrs/fsrsEngine.js";
import { parseTextWithGemini } from "../../infrastructure/ai/geminiService.js";

export class GenerateAICardsUseCase {
  constructor(
    private readonly cardRepo: ICardRepository,
    private readonly deckRepo: IDeckRepository,
    private readonly fsrsEngine: FSRSEngine,
  ) {}

  async execute(
    deckId: string,
    inputText: string,
    apiKey: string,
    fetchFn?: typeof fetch,
  ): Promise<CardEntity[]> {
    const deck = await this.deckRepo.getById(deckId);
    if (!deck) {
      throw new Error(`Deck with id ${deckId} not found`);
    }

    const rawCards = await parseTextWithGemini(inputText, apiKey, fetchFn);
    const nowIso = new Date().toISOString();

    const createdCards: CardEntity[] = rawCards.map((raw, idx) => ({
      id: `card_ai_${Date.now()}_${idx}`,
      deckId,
      kanji: raw.kanji,
      pinyin: raw.pinyin,
      meaning: raw.meaning,
      radicalAnalysis: raw.radical,
      exampleSentence: raw.example,
      hskLevel: raw.hskLevel || 1,
      fsrsState: this.fsrsEngine.createNewCardState(),
      createdAt: nowIso,
      updatedAt: nowIso,
    }));

    await this.cardRepo.saveBatch(createdCards);

    // Update deck metadata
    deck.cardCount += createdCards.length;
    deck.newCardCount += createdCards.length;
    deck.updatedAt = nowIso;
    await this.deckRepo.save(deck);

    return createdCards;
  }
}
