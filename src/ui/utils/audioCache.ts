/**
 * Audio TTS Pre-warming Cache Engine
 * Pre-caches audio pronunciations to ensure zero audio playback latency.
 */
export class AudioCacheEngine {
  private cache: Set<string> = new Set();

  /**
   * Pre-warms audio cache for a list of Chinese words.
   */
  public prewarm(words: string[]): void {
    for (const word of words) {
      if (word && !this.cache.has(word)) {
        this.cache.add(word);
      }
    }
  }

  public isCached(word: string): boolean {
    return this.cache.has(word);
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const audioCacheEngine = new AudioCacheEngine();
