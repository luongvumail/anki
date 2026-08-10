import { ICardRepository } from "../../domain/card/cardRepository.i.js";

export type QuizType =
  | "KANJI_TO_MEANING"
  | "KANJI_TO_PINYIN"
  | "AUDIO_TO_KANJI"
  | "FILL_IN_BLANK";

export interface QuizQuestion {
  id: string;
  cardId: string;
  type: QuizType;
  questionText: string;
  correctAnswer: string;
  options: string[];
  kanji: string;
  pinyin: string;
  meaning: string;
}

const FALLBACK_DISTRACTORS: Record<QuizType, string[]> = {
  KANJI_TO_MEANING: ["Quả táo", "Uống nước", "Cửa hàng", "Thầy giáo", "Học tập", "Cảm ơn"],
  KANJI_TO_PINYIN: ["xué xí", "píng guǒ", "hē chá", "lǎo shī", "xīe xie", "zài jiàn"],
  AUDIO_TO_KANJI: ["学习", "苹果", "喝茶", "老师", "谢谢", "再见"],
  FILL_IN_BLANK: ["学习", "苹果", "喝茶", "老师", "谢谢", "再见"],
};

export class GenerateQuizUseCase {
  constructor(private readonly cardRepo: ICardRepository) {}

  async execute(deckId: string, limit = 10): Promise<QuizQuestion[]> {
    const deckCards = await this.cardRepo.getByDeckId(deckId);
    if (deckCards.length === 0) return [];

    const allMeanings = deckCards.map((c) => c.meaning);
    const allPinyins = deckCards.map((c) => c.pinyin);

    // Shuffle and pick cards up to limit
    const selectedCards = [...deckCards].sort(() => 0.5 - Math.random()).slice(0, limit);

    return selectedCards.map((card, index) => {
      const types: QuizType[] = [
        "KANJI_TO_MEANING",
        "KANJI_TO_PINYIN",
        "AUDIO_TO_KANJI",
        "FILL_IN_BLANK",
      ];
      let type = types[index % types.length];

      // If card doesn't have an example sentence, fallback to KANJI_TO_MEANING
      if (type === "FILL_IN_BLANK" && !card.exampleSentence) {
        type = "KANJI_TO_MEANING";
      }

      let questionText = "";
      let correctAnswer = "";
      let distractorPool: string[] = [];

      if (type === "FILL_IN_BLANK" && card.exampleSentence) {
        questionText = card.exampleSentence.replace(card.kanji, " _____ ");
        correctAnswer = card.kanji;
        distractorPool = deckCards.map((c) => c.kanji).filter((k) => k !== card.kanji);
      } else if (type === "KANJI_TO_MEANING") {
        questionText = card.kanji;
        correctAnswer = card.meaning;
        distractorPool = allMeanings.filter((m) => m !== card.meaning);
      } else if (type === "KANJI_TO_PINYIN") {
        questionText = card.kanji;
        correctAnswer = card.pinyin;
        distractorPool = allPinyins.filter((p) => p !== card.pinyin);
      } else {
        questionText = card.pinyin;
        correctAnswer = card.kanji;
        distractorPool = deckCards.map((c) => c.kanji).filter((k) => k !== card.kanji);
      }

      // Add fallback distractors if pool is too small
      if (distractorPool.length < 3) {
        const fallbacks = FALLBACK_DISTRACTORS[type].filter((f) => f !== correctAnswer);
        distractorPool = [...distractorPool, ...fallbacks];
      }

      // Pick 3 random wrong options
      const wrongOptions = [...distractorPool].sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = Array.from(new Set([correctAnswer, ...wrongOptions])).sort(
        () => 0.5 - Math.random()
      );

      return {
        id: `quiz_${card.id}_${index}`,
        cardId: card.id,
        type,
        questionText,
        correctAnswer,
        options,
        kanji: card.kanji,
        pinyin: card.pinyin,
        meaning: card.meaning,
      };
    });
  }
}
