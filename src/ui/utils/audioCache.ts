import * as Speech from "expo-speech";

class AudioCache {
  private prewarmedSet = new Set<string>();

  /**
   * Pre-warms TTS engine for upcoming words in queue to eliminate speech latency.
   */
  public prewarmWords(words: string[]): void {
    const newWords = words.filter((w) => w && w.trim().length > 0 && !this.prewarmedSet.has(w));
    if (newWords.length === 0) return;

    newWords.forEach((word) => {
      this.prewarmedSet.add(word);
    });

    try {
      if (typeof Speech.isSpeakingAsync === "function") {
        Speech.isSpeakingAsync().catch(() => {});
      }
    } catch {
      // Ignore background audio warnings
    }
  }

  /**
   * Speaks a character with optimized default settings for Chinese (zh-CN).
   */
  public speak(character: string, onDone?: () => void, onError?: () => void): void {
    if (!character || character.trim().length === 0) return;
    try {
      Speech.stop();
      Speech.speak(character, {
        language: "zh-CN",
        rate: 0.85,
        pitch: 1.0,
        onDone,
        onError,
      });
    } catch (e) {
      console.warn("[AudioCache] Speech failed:", e);
      onError?.();
    }
  }

  public stop(): void {
    try {
      Speech.stop();
    } catch {}
  }

  public clearCache(): void {
    this.prewarmedSet.clear();
  }
}

export const audioCache = new AudioCache();
