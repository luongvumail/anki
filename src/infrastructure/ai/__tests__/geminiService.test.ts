import { describe, expect, it } from "vitest";
import { parseTextWithGemini } from "../geminiService.js";

describe("geminiService", () => {
  it("should parse valid Gemini JSON response into card objects", async () => {
    const mockFetch = async () =>
      ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify([
                      {
                        kanji: "学习",
                        pinyin: "xué xí",
                        meaning: "Học tập",
                        radical: "子",
                        hskLevel: 1,
                      },
                      {
                        kanji: "汉字",
                        pinyin: "hàn zì",
                        meaning: "Chữ Hán",
                        radical: "宀",
                        hskLevel: 2,
                      },
                    ]),
                  },
                ],
              },
            },
          ],
        }),
      }) as Response;

    const cards = await parseTextWithGemini("学习汉字", "mock_key", mockFetch as typeof fetch);

    expect(cards.length).toBe(2);
    expect(cards[0].kanji).toBe("学习");
    expect(cards[0].meaning).toBe("Học tập");
    expect(cards[1].kanji).toBe("汉字");
    expect(cards[1].pinyin).toBe("hàn zì");
  });

  it("should throw error if Gemini API Key is missing", async () => {
    await expect(parseTextWithGemini("你好", "")).rejects.toThrow("Chưa cấu hình GEMINI_API_KEY");
  });
});
