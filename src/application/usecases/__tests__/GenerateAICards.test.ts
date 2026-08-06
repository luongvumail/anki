import { describe, expect, it, vi } from "vitest";
import { ICardRepository } from "../../../domain/card/cardRepository.i";
import { GeminiService } from "../../../infrastructure/ai/geminiService";
import { GenerateAICardsUseCase } from "../GenerateAICards";

describe("GenerateAICardsUseCase", () => {
  it("generates cards via GeminiService, assigns IDs/deckId, and saves to repository", async () => {
    const mockGeminiService = {
      generateCards: vi.fn().mockResolvedValue({
        cards: [
          {
            character: "苹果",
            pinyin: "píng guǒ",
            translation: "quả táo",
            examples: [],
            radical: "Mộc (木)",
            strokeCount: 8,
            hskLevel: 1,
            tags: ["fruit"],
          },
        ],
        rawText: "[]",
      }),
    } as unknown as GeminiService;

    const mockRepo = {
      saveCards: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICardRepository;

    const useCase = new GenerateAICardsUseCase(mockGeminiService, mockRepo);
    const result = await useCase.execute({
      topic: "Trái cây",
      deckId: "deck-123",
      count: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].deckId).toBe("deck-123");
    expect(result[0].character).toBe("苹果");
    expect(mockRepo.saveCards).toHaveBeenCalledWith(result);
  });
});
