import { GeminiService } from "../../infrastructure/ai/geminiService";

export class GenerateRadicalUseCase {
  private geminiService: GeminiService;

  constructor(geminiService: GeminiService = new GeminiService()) {
    this.geminiService = geminiService;
  }

  public async execute(character: string): Promise<string> {
    if (!character || character.trim().length === 0) return "";
    return await this.geminiService.generateRadical(character);
  }
}
