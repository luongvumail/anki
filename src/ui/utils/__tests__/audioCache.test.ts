import { describe, expect, it, vi } from "vitest";
import { audioCache } from "../audioCache";

vi.mock("expo-speech", () => ({
  speak: vi.fn(),
  stop: vi.fn(),
  isSpeakingAsync: vi.fn().mockResolvedValue(false),
}));

describe("audioCache", () => {
  it("pre-warms upcoming Chinese words without throwing", () => {
    expect(() => audioCache.prewarmWords(["你好", "谢谢", "水"])).not.toThrow();
  });

  it("handles empty or blank word pre-warming gracefully", () => {
    expect(() => audioCache.prewarmWords(["", "   "])).not.toThrow();
  });

  it("clears pre-warmed cache", () => {
    audioCache.prewarmWords(["你好"]);
    expect(() => audioCache.clearCache()).not.toThrow();
  });
});
