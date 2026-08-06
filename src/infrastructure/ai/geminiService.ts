import { GoogleGenerativeAI } from "@google/generative-ai";
import { AICardListResponseSchema } from "../../application/dto/cardSchemas";
import { CardEntity } from "../../domain/card/cardEntity";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

export interface GeminiCardGenerationResult {
  cards: Omit<CardEntity, "id" | "deckId" | "createdAt" | "updatedAt">[];
  rawText: string;
}

export interface CardData {
  character: string;
  traditional?: string;
  pinyin: string;
  hanviet?: string;
  translation: string;
  examples: {
    chinese: string;
    pinyin: string;
    vietnamese: string;
  }[];
  radical?: string;
  strokeCount?: number;
  hskLevel?: number;
  tags?: string[];
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 50)
    .replace(/[`"'{}\\[\]\n\r]/g, " ")
    .replace(/\s+/g, " ");
}

function cleanRadicalText(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[\-\*•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^[\s\-=_]{3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export class GeminiService {
  private async generateWithFallback(prompt: string): Promise<string> {
    let lastError: unknown = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("All Gemini candidate models failed");
  }

  private async generateWithFallbackText(prompt: string): Promise<string> {
    let lastError: unknown = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.3 },
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("All Gemini candidate text models failed");
  }

  private extractCleanJson(rawText: string): string {
    let cleaned = rawText.trim();
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      const lastBracket = cleaned.lastIndexOf("]");
      if (lastBracket !== -1) {
        cleaned = cleaned.slice(firstBracket, lastBracket + 1);
      }
    } else if (firstBrace !== -1) {
      const lastBrace = cleaned.lastIndexOf("}");
      if (lastBrace !== -1) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
    }

    cleaned = cleaned.replace(/,\s*([\}\]])/g, "$1");
    return cleaned;
  }

  /**
   * Generates AI vocabulary card batch and parses with strict Zod Schema.
   */
  public async generateCards(
    topic: string,
    count: number = 5,
    hskLevel?: number,
  ): Promise<GeminiCardGenerationResult> {
    const hskClause = hskLevel ? `trình độ HSK ${hskLevel}` : "mọi trình độ";
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
    }));

    return {
      cards,
      rawText,
    };
  }

  public async generateCardData(input: string): Promise<CardData> {
    const cleanInput = sanitizeInput(input);
    const prompt = `Bạn là chuyên gia Hán-Việt. Phân tích chi tiết từ tiếng Trung: "${cleanInput}"

TRƯỜNG "radical" — BẮT BUỘC, NGẮN GỌN TỐI ĐA 2 CÂU:
Câu 1: bộ thủ cấu thành (tên Hán-Việt + ký tự + nghĩa). Câu 2: mẹo nhớ hình ảnh.

Trả về JSON (CHỈ JSON, không markdown):
{
  "character": "chữ giản thể",
  "traditional": "chữ phồn thể",
  "pinyin": "phiên âm có dấu",
  "translation": "nghĩa tiếng Việt ngắn gọn (tối đa 3 nghĩa)",
  "examples": [
    {
      "chinese": "câu ví dụ ngắn",
      "pinyin": "phiên âm câu ví dụ",
      "vietnamese": "dịch nghĩa"
    }
  ],
  "radical": "tối đa 2 câu: bộ thủ + mẹo nhớ",
  "strokeCount": 0,
  "hskLevel": 1,
  "tags": ["loại từ"]
}`;

    const text = await this.generateWithFallback(prompt);
    const jsonText = this.extractCleanJson(text);
    return JSON.parse(jsonText) as CardData;
  }

  public async generateCardDataBatch(inputs: string[]): Promise<CardData[]> {
    if (inputs.length === 0) return [];
    if (inputs.length === 1) return [await this.generateCardData(inputs[0])];

    const cleanInputs = inputs.map(sanitizeInput);
    const wordList = cleanInputs.map((w, i) => `${i + 1}. "${w}"`).join("\n");

    const prompt = `Bạn là chuyên gia Hán-Việt. Phân tích chi tiết các từ tiếng Trung sau đây:
${wordList}

BẮT BUỘC VỀ TRƯỜNG "radical":
Trường "radical" BẮT BUỘC phải phân tích rõ ràng từng chữ Hán được ghép từ các bộ thủ chính nào, tên Hán-Việt và ý nghĩa của từng bộ thủ. KHÔNG ĐƯỢC bỏ trống hoặc trả về chung chung.

Trả về JSON array (CHỈ JSON array, không markdown), với mỗi phần tử theo thứ tự tương ứng:
[
  {
    "character": "chữ giản thể",
    "traditional": "chữ phồn thể",
    "pinyin": "phiên âm có dấu",
    "translation": "nghĩa tiếng Việt ngắn gọn (tối đa 3 nghĩa)",
    "examples": [
      {
        "chinese": "câu ví dụ ngắn",
        "pinyin": "phiên âm câu ví dụ",
        "vietnamese": "dịch nghĩa"
      }
    ],
    "radical": "tên bộ thủ và cấu tạo chiết tự đầy đủ",
    "strokeCount": 0,
    "hskLevel": 1,
    "tags": ["loại từ"]
  }
]`;

    try {
      const text = await this.generateWithFallback(prompt);
      const jsonText = this.extractCleanJson(text);
      const results = JSON.parse(jsonText) as CardData[];
      if (!Array.isArray(results) || results.length !== inputs.length) {
        throw new Error(`Expected ${inputs.length} results, got ${results.length}`);
      }
      return results;
    } catch (err) {
      return Promise.all(inputs.map((input) => this.generateCardData(input)));
    }
  }

  public async generateRadical(character: string): Promise<string> {
    const clean = sanitizeInput(character);
    const prompt = `Phân tích chiết tự từ "${clean}" bằng tiếng Việt, ngắn gọn tối đa 2 câu.
Câu 1: liệt kê bộ thủ (tên Hán-Việt + ký tự + nghĩa). Câu 2: mẹo nhớ hình ảnh.
Không dùng markdown, không giải thích thêm, không chào hỏi.
Ví dụ tốt: "好: bộ Nữ (女) + bộ Tử (子). Mẹ ôm con → tốt đẹp."
Ví dụ tốt: "学: bộ Học (學) gồm 爫+冖+子, trẻ con ngồi dưới mái học bài → học tập."
Phân tích từ: "${clean}"`;

    const raw = await this.generateWithFallbackText(prompt);
    return cleanRadicalText(raw);
  }
}
