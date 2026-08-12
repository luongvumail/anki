import { GoogleGenerativeAI } from "@google/generative-ai";
import { APP_CONFIG } from "../constants/config";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const proxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || "";
const appToken = process.env.EXPO_PUBLIC_APP_TOKEN || "";
const genAI = new GoogleGenerativeAI(apiKey);

// gemini-3.5-flash: latest GA model, fast & capable (July 2026)
// gemini-3.1-flash-lite: cheapest fallback ($0.25/$1.50 per 1M tokens)
const CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

/**
 * Sends request to Cloudflare Worker proxy if EXPO_PUBLIC_AI_PROXY_URL is configured.
 */
async function generateViaProxy(
  modelName: string,
  prompt: string,
  responseMimeType?: string,
  temperature = 0.1
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (appToken) {
    headers["X-App-Token"] = appToken;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelName,
        prompt,
        responseMimeType,
        temperature,
      }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Proxy error: HTTP ${response.status}`);
    }
    return data.text ?? "";
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: unknown = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      if (__DEV__) console.log(`[Gemini] Attempting generation with model: ${modelName}`);
      if (proxyUrl) {
        const text = await generateViaProxy(modelName, prompt, "application/json", 0.1);
        if (__DEV__) console.log(`[Gemini/Proxy] Success using model: ${modelName}`);
        return text;
      }

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (__DEV__) console.log(`[Gemini] Success using model: ${modelName}`);
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Gemini] Model ${modelName} failed (${msg}), trying fallback...`,
      );
      lastError = err;
    }
  }
  throw lastError;
}

/** Plain-text variant — does NOT force JSON mime type. Used for radical/creative analysis. */
async function generateWithFallbackText(prompt: string): Promise<string> {
  let lastError: unknown = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      if (__DEV__) console.log(`[Gemini/text] Attempting with model: ${modelName}`);
      if (proxyUrl) {
        const text = await generateViaProxy(modelName, prompt, undefined, 0.3);
        if (__DEV__) console.log(`[Gemini/text/Proxy] Success using model: ${modelName}`);
        return text;
      }

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.3 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (__DEV__) console.log(`[Gemini/text] Success using model: ${modelName}`);
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini/text] Model ${modelName} failed (${msg}), trying fallback...`);
      lastError = err;
    }
  }
  throw lastError;
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .slice(0, 50)
    .replace(/[`"'{}\\[\]\n\r]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Debounce helper for AI requests to prevent API spamming
 */
let lastRequestTime = 0;
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < APP_CONFIG.GEMINI_DEBOUNCE_MS) {
    await new Promise((resolve) => setTimeout(resolve, APP_CONFIG.GEMINI_DEBOUNCE_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Robust JSON extraction helper: strips markdown blocks, preamble/postscript text, and trailing commas.
 */
function extractCleanJson(rawText: string): string {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

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
          const e = ex && typeof ex === "object" ? (ex as Record<string, unknown>) : {};
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
    tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === "string") : [],
  };
}

/**
 * Uses a SINGLE Gemini request to generate card data for multiple Chinese words at once.
 * Much faster and cheaper than calling generateCardData() separately for each word.
 * Falls back to parallel individual calls if the batch prompt fails.
 */
export async function generateCardDataBatch(inputs: string[]): Promise<CardData[]> {
  if (inputs.length === 0) return [];
  if (inputs.length === 1) return [await generateCardData(inputs[0])];

  const cleanInputs = inputs.map(sanitizeInput);
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
    if (!Array.isArray(rawResults) || rawResults.length !== inputs.length) {
      throw new Error(`Expected ${inputs.length} results, got ${Array.isArray(rawResults) ? rawResults.length : "non-array"}`);
    }
    return rawResults.map(validateSingleCardData);
  } catch (err) {
    // Fallback: parallel individual calls if batch fails
    console.warn("[Gemini] Batch failed, falling back to parallel individual calls:", err);
    return Promise.all(inputs.map((input) => generateCardData(input)));
  }
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
 * Generates radical/component breakdown analysis for a single Chinese character or word.
 * Used to retroactively fill in the `radical` field for older cards that were created without it.
 * Returns clean plain-text Vietnamese — no markdown, no JSON.
 */
export async function generateRadical(character: string): Promise<string> {
  const clean = sanitizeInput(character);
  const prompt = `Phân tích chiết tự từ "${clean}" bằng tiếng Việt, ngắn gọn tối đa 2 câu.
Câu 1: liệt kê bộ thủ (tên Hán-Việt + ký tự + nghĩa). Câu 2: mẹo nhớ hình ảnh.
Không dùng markdown, không giải thích thêm, không chào hỏi.
Ví dụ tốt: "好: bộ Nữ (女) + bộ Tử (子). Mẹ ôm con → tốt đẹp."
Ví dụ tốt: "学: bộ Học (學) gồm 爫+冖+子, trẻ con ngồi dưới mái học bài → học tập."
Phân tích từ: "${clean}"`;

  const raw = await generateWithFallbackText(prompt);
  return cleanRadicalText(raw);
}

/**
 * Strips all markdown and formatting artifacts from AI plain-text output.
 */
function cleanRadicalText(raw: string): string {
  return raw
    // Remove fenced code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove markdown bold/italic markers
    .replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, "$1")
    // Remove markdown headings (#, ##, ###)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bullet list markers (- , * , • )
    .replace(/^[\-\*•]\s+/gm, "")
    // Remove numbered list (1. 2. etc)
    .replace(/^\d+\.\s+/gm, "")
    // Remove HTML tags
    .replace(/<[^>]+>/g, "")
    // Remove lines that are just punctuation/whitespace
    .replace(/^[\s\-=_]{3,}$/gm, "")
    // Collapse 3+ newlines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
