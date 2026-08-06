import { GeminiService, CardData } from "../../infrastructure/ai/geminiService";

export class GenerateCardBatchUseCase {
  private geminiService: GeminiService;

  constructor(geminiService: GeminiService = new GeminiService()) {
    this.geminiService = geminiService;
  }

  public async execute(words: string[]): Promise<(CardData | null)[]> {
    if (!words || words.length === 0) return [];
    return await this.geminiService.generateCardDataBatch(words);
  }
}
