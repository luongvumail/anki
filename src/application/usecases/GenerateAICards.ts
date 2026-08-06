import { CardEntity } from '../../domain/card/cardEntity';
import { ICardRepository } from '../../domain/card/cardRepository.i';
import { GeminiService } from '../../infrastructure/ai/geminiService';
import { GenerateAICardsPayloadSchema } from '../dto/cardSchemas';

export interface GenerateAICardsInput {
  topic: string;
  deckId: string;
  count?: number;
  hskLevel?: number;
}

export class GenerateAICardsUseCase {
  private geminiService: GeminiService;
  private cardRepository: ICardRepository;

  constructor(geminiService: GeminiService, cardRepository: ICardRepository) {
    this.geminiService = geminiService;
    this.cardRepository = cardRepository;
  }

  public async execute(input: GenerateAICardsInput): Promise<CardEntity[]> {
    // Input validation
    const validated = GenerateAICardsPayloadSchema.parse({
      topic: input.topic,
      count: input.count ?? 5,
      hskLevel: input.hskLevel,
    });

    const result = await this.geminiService.generateCards(
      validated.topic,
      validated.count,
      validated.hskLevel
    );

    const nowStr = new Date().toISOString();
    const createdCards: CardEntity[] = result.cards.map((card, index) => ({
      ...card,
      id: `ai-card-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      deckId: input.deckId,
      createdAt: nowStr,
      updatedAt: nowStr,
    }));

    await this.cardRepository.saveCards(createdCards);
    return createdCards;
  }
}
