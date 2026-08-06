import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddCardUseCase } from "../AddCard";
import { UpdateCardUseCase } from "../UpdateCard";
import { DeleteCardUseCase } from "../DeleteCard";
import { ResetDeckProgressUseCase } from "../ResetDeckProgress";
import { GenerateRadicalUseCase } from "../GenerateRadical";
import { GenerateCardBatchUseCase } from "../GenerateCardBatch";
import { CardEntity } from "../../../domain/card/cardEntity";

describe("Card Mutation & AI Use Cases", () => {
  let mockRepo: any;
  let mockGemini: any;

  beforeEach(() => {
    mockRepo = {
      saveCard: vi.fn().mockResolvedValue(undefined),
      saveCards: vi.fn().mockResolvedValue(undefined),
      deleteCard: vi.fn().mockResolvedValue(undefined),
    };
    mockGemini = {
      generateRadical: vi.fn().mockResolvedValue("氵 (Bộ Thủy)"),
      generateCardDataBatch: vi.fn().mockResolvedValue([
        { character: "水", pinyin: "shuǐ", translation: "Nước", examples: [] },
      ]),
    };
  });

  it("AddCardUseCase creates card with default FSRS state and saves to repository", async () => {
    const useCase = new AddCardUseCase(mockRepo);
    const result = await useCase.execute({
      deckId: "deck-1",
      character: "你好",
      pinyin: "nǐ hǎo",
      translation: "Hello",
    });

    expect(result.id).toBeDefined();
    expect(result.fsrs).toBeDefined();
    expect(result.character).toBe("你好");
    expect(mockRepo.saveCard).toHaveBeenCalledWith(result);
  });

  it("UpdateCardUseCase updates card properties and timestamp", async () => {
    const useCase = new UpdateCardUseCase(mockRepo);
    const targetCard: CardEntity = {
      id: "card-1",
      deckId: "deck-1",
      character: "你好",
      pinyin: "nǐ hǎo",
      translation: "Hello",
      examples: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    const updated = await useCase.execute({
      targetCard,
      updates: { translation: "Xin chào" },
    });

    expect(updated.translation).toBe("Xin chào");
    expect(mockRepo.saveCard).toHaveBeenCalledWith(updated);
  });

  it("DeleteCardUseCase calls repo deleteCard", async () => {
    const useCase = new DeleteCardUseCase(mockRepo);
    await useCase.execute("card-1");

    expect(mockRepo.deleteCard).toHaveBeenCalledWith("card-1");
  });

  it("ResetDeckProgressUseCase resets FSRS state for all cards in deck", async () => {
    const useCase = new ResetDeckProgressUseCase(mockRepo);
    const cards: CardEntity[] = [
      {
        id: "card-1",
        deckId: "deck-1",
        character: "你好",
        pinyin: "nǐ hǎo",
        translation: "Hello",
        examples: [],
        fsrs: { state: 2, reps: 5, stability: 10, difficulty: 5, due: "2026-01-01T00:00:00Z", lapses: 0, last_review: "2026-01-01T00:00:00Z" },
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    const reset = await useCase.execute(cards);
    expect(reset[0].fsrs?.reps).toBe(0);
    expect(reset[0].fsrs?.stability).toBe(0);
    expect(mockRepo.saveCards).toHaveBeenCalled();
  });

  it("GenerateRadicalUseCase delegates to GeminiService", async () => {
    const useCase = new GenerateRadicalUseCase(mockGemini);
    const radical = await useCase.execute("水");

    expect(radical).toBe("氵 (Bộ Thủy)");
    expect(mockGemini.generateRadical).toHaveBeenCalledWith("水");
  });

  it("GenerateCardBatchUseCase delegates to GeminiService batch generator", async () => {
    const useCase = new GenerateCardBatchUseCase(mockGemini);
    const results = await useCase.execute(["水"]);

    expect(results).toHaveLength(1);
    expect(results[0]?.character).toBe("水");
  });
});
