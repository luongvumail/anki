import { GeminiService } from "../../infrastructure/ai/geminiService.js";
import { logger } from "../../ui/utils/logger.js";

export class GenerateRadicalUseCase {
  constructor(private readonly geminiService: GeminiService) {}

  async execute(kanji: string): Promise<string> {
    logger.info(`Analyzing radical breakdown for kanji: ${kanji}`);
    const cards = await this.geminiService.generateCardsFromText(kanji, "deck_radical");
    return cards[0]?.radicalAnalysis || "Bộ thủ cơ bản";
  }
}
