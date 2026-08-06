import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AICardListResponseSchema,
  AICardResponseItemSchema,
} from '../../application/dto/cardSchemas';
import { CardEntity } from '../../domain/card/cardEntity';
import { FSRSEngine } from '../../domain/fsrs/fsrsEngine';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

export interface GeminiCardGenerationResult {
  cards: Omit<CardEntity, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>[];
  rawText: string;
}

export class GeminiService {
  private fsrsEngine: FSRSEngine;

  constructor(fsrsEngine: FSRSEngine = new FSRSEngine()) {
    this.fsrsEngine = fsrsEngine;
  }

  private async generateWithFallback(prompt: string): Promise<string> {
    let lastError: unknown = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('All Gemini candidate models failed');
  }

  private extractCleanJson(rawText: string): string {
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      const lastBracket = cleaned.lastIndexOf(']');
      if (lastBracket !== -1) {
        cleaned = cleaned.slice(firstBracket, lastBracket + 1);
      }
    } else if (firstBrace !== -1) {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
    }

    cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');
    return cleaned;
  }

  /**
   * Generates AI vocabulary card batch and parses with strict Zod Schema.
   */
  public async generateCards(
    topic: string,
    count: number = 5,
    hskLevel?: number
  ): Promise<GeminiCardGenerationResult> {
    const hskClause = hskLevel ? `trình độ HSK ${hskLevel}` : 'mọi trình độ';
    const prompt = `Bạn là chuyên gia giảng dạy Hán-Việt. Hãy tạo ${count} từ vựng tiếng Trung chủ đề: "${topic}" (${hskClause}).

Yêu cầu dữ liệu:
- Trường "radical": bắt buộc phân tích chi tiết bộ thủ + mẹo nhớ.
- Trả về JSON array chính xác với ${count} phần tử.

Cấu trúc JSON từng item:
{
  "character": "chữ giản thể",
  "traditional": "chữ phồn thể",
  "pinyin": "phiên âm",
  "translation": "dịch nghĩa tiếng Việt",
  "examples": [
    {
      "chinese": "câu ví dụ",
      "pinyin": "phiên âm",
      "vietnamese": "dịch nghĩa"
    }
  ],
  "radical": "bộ thủ + mẹo nhớ",
  "strokeCount": 8,
  "hskLevel": ${hskLevel || 1},
  "tags": ["${topic}"]
}`;

    const rawText = await this.generateWithFallback(prompt);
    const jsonStr = this.extractCleanJson(rawText);
    const parsedJson = JSON.parse(jsonStr);

    // Validate with Zod
    const validatedItems = AICardListResponseSchema.parse(parsedJson);

    const now = new Date();
    const cards = validatedItems.map((item) => ({
      character: item.character,
      traditional: item.traditional,
      pinyin: item.pinyin,
      hanviet: item.hanviet,
      translation: item.translation,
      examples: item.examples,
      radical: item.radical,
      strokeCount: item.strokeCount,
      hskLevel: item.hskLevel,
      tags: item.tags,
      fsrs: this.fsrsEngine.createEmptyCard(now),
    }));

    return {
      cards,
      rawText,
    };
  }
}
