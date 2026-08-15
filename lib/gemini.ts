import { GoogleGenerativeAI } from "@google/generative-ai";
import { APP_CONFIG } from "../constants/config";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const CANDIDATE_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"];

/**
 * Sleep helper for retry backoff
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithModels(
  prompt: string,
  responseMimeType?: string,
  temperature = 0.1,
): Promise<string> {
  let lastError: unknown = null;

  for (const modelName of CANDIDATE_MODELS) {
    // Retry up to 2 times for transient errors or 429 rate limits
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (__DEV__) console.log(`[Gemini] Attempting generation with model: ${modelName} (attempt ${attempt + 1})`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            ...(responseMimeType ? { responseMimeType } : {}),
            temperature,
          },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (__DEV__) console.log(`[Gemini] Success using model: ${modelName}`);
        return text;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");

        console.warn(`[Gemini] Model ${modelName} attempt ${attempt + 1} failed: ${msg}`);

        if (isRateLimit && attempt === 0) {
          // Wait 1.5s before second attempt on same model
          await delay(1500);
          continue;
        }
        break; // Move to fallback model
      }
    }
  }

  throw lastError;
}

function generateWithFallback(prompt: string): Promise<string> {
  return generateWithModels(prompt, "application/json", 0.1);
}

function generateWithFallbackText(prompt: string): Promise<string> {
  return generateWithModels(prompt, undefined, 0.3);
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 1000)
    .replace(/[`"'{}\\[\]\n\r]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Debounce & queue helper for AI requests to prevent API spamming and concurrency stampedes
 */
let lastRequestTime = 0;
let rateLimitQueue = Promise.resolve();

async function enforceRateLimit(): Promise<void> {
  rateLimitQueue = rateLimitQueue.then(async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < APP_CONFIG.GEMINI_DEBOUNCE_MS) {
      await new Promise((resolve) => setTimeout(resolve, APP_CONFIG.GEMINI_DEBOUNCE_MS - elapsed));
    }
    lastRequestTime = Date.now();
  });
  return rateLimitQueue;
}

/**
 * Robust JSON extraction helper: strips markdown blocks, preamble/postscript text, and trailing commas.
 */
function extractCleanJson(rawText: string): string {
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

/**
 * Uses Gemini to auto-fill vocabulary card details for a single Chinese word.
 */
export async function generateCardData(input: string): Promise<CardData> {
  await enforceRateLimit();
  const cleanInput = sanitizeInput(input);
  const prompt = `Bạn là chuyên gia Hán-Việt. Phân tích chi tiết từ tiếng Trung: "${cleanInput}"

TRƯỜNG "radical" — BẮT BUỘC, NGẮN GỌN TỐI ĐA 2 CÂU:
Câu 1: bộ thủ cấu thành (tên Hán-Việt + ký tự + nghĩa). Câu 2: mẹo nhớ hình ảnh.
Ví dụ: "好: bộ Nữ (女) + bộ Tử (子). Mẹ ôm con → tốt đẹp."
Ví dụ: "休: bộ Nhân (亻) + bộ Mộc (木). Người tựa cây nghỉ ngơi."

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

  const text = await generateWithFallback(prompt);
  const jsonText = extractCleanJson(text);
  if (!jsonText) {
    throw new Error("AI không phản hồi dữ liệu JSON hợp lệ.");
  }
  const parsed = JSON.parse(jsonText);
  return validateSingleCardData(parsed);
}

/**
 * Runtime schema validator for CardData objects.
 */
export function validateSingleCardData(raw: unknown): CardData {
  if (!raw || typeof raw !== "object") {
    throw new Error("Dữ liệu AI trả về không hợp lệ.");
  }
  const item = raw as Record<string, unknown>;
  return {
    character: typeof item.character === "string" ? item.character : "",
    traditional: typeof item.traditional === "string" ? item.traditional : undefined,
    pinyin: typeof item.pinyin === "string" ? item.pinyin : "",
    hanviet: typeof item.hanviet === "string" ? item.hanviet : undefined,
    translation: typeof item.translation === "string" ? item.translation : "",
    examples: Array.isArray(item.examples)
      ? item.examples.map((ex: unknown) => {
          if (!ex || typeof ex !== "object") return { chinese: "", pinyin: "", vietnamese: "" };
          const e = ex as Record<string, unknown>;
          return {
            chinese: typeof e.chinese === "string" ? e.chinese : "",
            pinyin: typeof e.pinyin === "string" ? e.pinyin : "",
            vietnamese: typeof e.vietnamese === "string" ? e.vietnamese : "",
          };
        })
      : [],
    radical: typeof item.radical === "string" ? item.radical : undefined,
    strokeCount: typeof item.strokeCount === "number" ? item.strokeCount : undefined,
    hskLevel: typeof item.hskLevel === "number" ? item.hskLevel : undefined,
    tags: Array.isArray(item.tags)
      ? item.tags.filter((t): t is string => typeof t === "string")
      : [],
  };
}

async function generateSingleSubBatch(chunkInputs: string[]): Promise<CardData[]> {
  await enforceRateLimit();
  const cleanInputs = chunkInputs.map(sanitizeInput);
  const wordList = cleanInputs.map((w, i) => `${i + 1}. "${w}"`).join("\n");

  const prompt = `Bạn là chuyên gia Hán-Việt. Phân tích chi tiết các từ tiếng Trung sau đây:
${wordList}

BẮT BUỘC VỀ TRƯỜNG "radical":
Trường "radical" BẮT BUỘC phải phân tích rõ ràng từng chữ Hán được ghép từ các bộ thủ chính nào, tên Hán-Việt và ý nghĩa của từng bộ thủ. KHÔNG ĐƯỢC bỏ trống hoặc trả về chung chung.
Ví dụ:
- "休": "Gồm bộ Nhân (亻 - người) + bộ Mộc (木 - cây). Người tựa vào gốc cây nghỉ ngơi."
- "语": "Gồm bộ Ngôn (讠 - lời nói) + bộ Ngũ (五) + bộ Khẩu (口 - miệng). Lời nói phát ra từ miệng."
- "好": "Gồm bộ Nữ (女 - phụ nữ) + bộ Tử (子 - con). Mẹ ôm con tượng trưng cho sự tốt đẹp."

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
    const text = await generateWithFallback(prompt);
    const jsonText = extractCleanJson(text);
    const rawResults = JSON.parse(jsonText);
    if (!Array.isArray(rawResults) || rawResults.length !== chunkInputs.length) {
      throw new Error(
        `Expected ${chunkInputs.length} results, got ${Array.isArray(rawResults) ? rawResults.length : "non-array"}`,
      );
    }
    return rawResults.map(validateSingleCardData);
  } catch (err) {
    console.warn("[Gemini] Sub-batch failed, falling back to sequential calls:", err);
    const results: CardData[] = [];
    for (const input of chunkInputs) {
      results.push(await generateCardData(input));
    }
    return results;
  }
}

/**
 * Uses Gemini request batching with automatic sub-chunking (max 12 words per chunk) to generate card data for multiple words safely.
 * Handles rate-limiting and token limits gracefully.
 */
export async function generateCardDataBatch(inputs: string[]): Promise<CardData[]> {
  if (inputs.length === 0) return [];
  if (inputs.length === 1) return [await generateCardData(inputs[0])];

  const BATCH_CHUNK_SIZE = 12;
  const allResults: CardData[] = [];

  for (let i = 0; i < inputs.length; i += BATCH_CHUNK_SIZE) {
    const chunk = inputs.slice(i, i + BATCH_CHUNK_SIZE);
    const chunkResults = await generateSingleSubBatch(chunk);
    allResults.push(...chunkResults);
  }

  return allResults;
}

/**
 * Generates a fill-in-the-blank quiz sentence for a given word.
 */
export async function generateQuizSentence(
  character: string,
  translation: string,
): Promise<{
  sentence: string;
  pinyin: string;
  answer: string;
  vietnamese: string;
}> {
  const prompt = `Tạo 1 câu tiếng Trung có dùng từ "${character}" (nghĩa: ${translation}), trong đó thay thế từ đó bằng ___. 
Trả về JSON:
{
  "sentence": "câu có dấu ___",
  "pinyin": "phiên âm câu (thay ___ bằng ___)",  
  "answer": "${character}",
  "vietnamese": "dịch nghĩa tiếng Việt"
}`;

  const text = await generateWithFallback(prompt);
  const jsonText = extractCleanJson(text);
  if (!jsonText) {
    throw new Error("AI không phản hồi dữ liệu JSON hợp lệ.");
  }
  return JSON.parse(jsonText);
}

/**
 * Generates radical/component breakdown analysis for a single Chinese character or word via Gemini AI.
 * Returns clean plain-text Vietnamese — no markdown, no JSON.
 */
export async function generateRadical(character: string): Promise<string> {
  const clean = sanitizeInput(character);
  const prompt = `Phân tích chiết tự từ "${clean}" bằng tiếng Việt, ngắn gọn tối đa 2 câu.
Câu 1: liệt kê bộ thủ (tên Hán-Việt + ký tự + nghĩa). Câu 2: mẹo nhớ hình ảnh.
Không dùng markdown, không giải thích thêm, không chào hỏi.
Ví dụ tốt: "好: bộ Nữ (女) + bộ Tử (子). Mẹ ôm con → tốt đẹp."
Ví dụ tốt: "学: bộ Học (學) gồm 宀+子, trẻ con ngồi dưới mái học bài → học tập."
Phân tích từ: "${clean}"`;

  const raw = await generateWithFallbackText(prompt);
  return cleanRadicalText(raw);
}

/**
 * Strips all markdown and formatting artifacts from AI plain-text output.
 */
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
