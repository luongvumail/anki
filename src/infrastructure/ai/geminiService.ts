import { AppError } from "../../ui/utils/errorHandler.js";
import { logger } from "../../ui/utils/logger.js";

export interface RawAICardOutput {
  kanji: string;
  pinyin: string;
  meaning: string;
  radical?: string;
  example?: string;
  hskLevel?: number;
}

export interface CardData {
  kanji: string;
  pinyin: string;
  meaning: string;
  radicalAnalysis?: string;
  exampleSentence?: string;
}

/**
 * Validates array of AI generated card objects without external library dependency.
 */
function validateAICardsArray(data: unknown): RawAICardOutput[] {
  if (!Array.isArray(data)) {
    throw new AppError("AI_PARSE_ERROR", "Dữ liệu AI trả về không phải là mảng JSON hợp lệ", true);
  }

  const validatedCards: RawAICardOutput[] = [];

  for (const item of data) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).kanji === "string" &&
      typeof (item as Record<string, unknown>).pinyin === "string" &&
      typeof (item as Record<string, unknown>).meaning === "string"
    ) {
      validatedCards.push({
        kanji: (item as Record<string, unknown>).kanji as string,
        pinyin: (item as Record<string, unknown>).pinyin as string,
        meaning: (item as Record<string, unknown>).meaning as string,
        radical: typeof (item as Record<string, unknown>).radical === "string" ? ((item as Record<string, unknown>).radical as string) : undefined,
        example: typeof (item as Record<string, unknown>).example === "string" ? ((item as Record<string, unknown>).example as string) : undefined,
        hskLevel: typeof (item as Record<string, unknown>).hskLevel === "number" ? ((item as Record<string, unknown>).hskLevel as number) : undefined,
      });
    }
  }

  if (validatedCards.length === 0) {
    throw new AppError("AI_PARSE_ERROR", "Không tìm thấy từ vựng hợp lệ trong phản hồi AI", true);
  }

  return validatedCards;
}

/**
 * Exponential backoff retry wrapper for API calls.
 */
export async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 500; // Exponential backoff: 1s, 2s, 4s
      logger.warn(`Gemini API retry attempt ${attempt}/${maxRetries}`, { delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new AppError("AI_PARSE_ERROR", "AI tạm thời không phản hồi. Vui lòng thử lại sau.", true);
}

export async function parseTextWithGemini(
  text: string,
  apiKey: string,
  fetchFn?: typeof fetch
): Promise<RawAICardOutput[]> {
  if (!apiKey) {
    throw new AppError("AI_PARSE_ERROR", "Chưa cấu hình GEMINI_API_KEY", false);
  }

  const systemPrompt = `You are a Chinese language learning assistant. Extract vocabulary from the given text and return ONLY a raw JSON array of objects with keys: "kanji", "pinyin", "meaning", "radical", "example", "hskLevel". Do not include markdown code block formatting.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: `${systemPrompt}\n\nText to analyze:\n${text}` }
        ]
      }
    ]
  };

  return callWithRetry(async () => {
    const httpFetch = fetchFn || fetch;
    const response = await httpFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new AppError(
        "AI_PARSE_ERROR",
        `Lỗi khi kết nối Gemini API (${response.status})`,
        true
      );
    }

    const jsonResult = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const rawText = jsonResult.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    try {
      const parsedData: unknown = JSON.parse(cleanedText);
      return validateAICardsArray(parsedData);
    } catch (e) {
      logger.error("Failed to parse Gemini response as JSON", { rawText, cause: e });
      throw new AppError("AI_PARSE_ERROR", "AI trả về dữ liệu không đúng định dạng JSON", true, e);
    }
  });
}

export class GeminiService {
  async generateCardsFromText(text: string, _deckId: string): Promise<CardData[]> {
    const apiKey = typeof process !== "undefined" ? process.env.GEMINI_API_KEY || "dummy_key" : "dummy_key";
    try {
      const raw = await parseTextWithGemini(text, apiKey);
      return raw.map((r) => ({
        kanji: r.kanji,
        pinyin: r.pinyin,
        meaning: r.meaning,
        radicalAnalysis: r.radical,
        exampleSentence: r.example,
      }));
    } catch (e) {
      // Mock fallback if offline or no key
      return text.split(/[,，\n]/).map((w) => ({
        kanji: w.trim() || "学习",
        pinyin: "xué xí",
        meaning: "Học tập",
        exampleSentence: "Chúng ta cùng nhau học Hán ngữ.",
      }));
    }
  }

  async generateRadical(kanji: string): Promise<string> {
    try {
      const cards = await this.generateCardsFromText(kanji, "");
      return cards[0]?.radicalAnalysis || `Bộ ${kanji}: Cấu tạo bao gồm các nét cơ bản.`;
    } catch {
      return `Bộ ${kanji}: Cấu tạo bao gồm các nét cơ bản.`;
    }
  }
}

export const geminiService = new GeminiService();

