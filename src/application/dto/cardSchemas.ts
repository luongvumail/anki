export interface CreateCardDTO {
  deckId: string;
  kanji: string;
  pinyin: string;
  meaning: string;
  radicalAnalysis?: string;
  exampleSentence?: string;
  hskLevel?: number;
}

export function validateCreateCardDTO(data: unknown): CreateCardDTO {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid payload: must be an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.deckId !== "string" || !obj.deckId) {
    throw new Error("Invalid payload: deckId is required");
  }
  if (typeof obj.kanji !== "string" || !obj.kanji) {
    throw new Error("Invalid payload: kanji is required");
  }
  if (typeof obj.pinyin !== "string" || !obj.pinyin) {
    throw new Error("Invalid payload: pinyin is required");
  }
  if (typeof obj.meaning !== "string" || !obj.meaning) {
    throw new Error("Invalid payload: meaning is required");
  }

  return {
    deckId: obj.deckId,
    kanji: obj.kanji,
    pinyin: obj.pinyin,
    meaning: obj.meaning,
    radicalAnalysis: typeof obj.radicalAnalysis === "string" ? obj.radicalAnalysis : undefined,
    exampleSentence: typeof obj.exampleSentence === "string" ? obj.exampleSentence : undefined,
    hskLevel: typeof obj.hskLevel === "number" ? obj.hskLevel : undefined,
  };
}
