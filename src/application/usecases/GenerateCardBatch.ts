import { CardData, GeminiService } from "../../infrastructure/ai/geminiService.js";
import { logger } from "../../ui/utils/logger.js";

export class GenerateCardBatchUseCase {
  constructor(private readonly geminiService: GeminiService) {}

  async execute(words: string[]): Promise<CardData[]> {
    logger.info(`Generating AI card batch for ${words.length} words`);
    const promptText = words.join(", ");
    return this.geminiService.generateCardsFromText(promptText, "deck_batch");
  }
}
