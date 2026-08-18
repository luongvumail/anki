import { Card } from "../store/slices/types";
import { APP_CONFIG } from "../constants/config";
import { FSRSState } from "./srs";

export type QuestionType =
  | "meaning_choice"
  | "hanzi_from_meaning"
  | "pinyin_choice"
  | "hanzi_from_pinyin"
  | "listening"
  | "listening_meaning"
  | "cloze";

export interface QuizQuestion {
  card: Card;
  type: QuestionType;
  prompt: string;
  targetText?: string;
  subText?: string;
  audioText?: string;
  clozeSentence?: string;
  clozeTranslation?: string;
  options: string[]; // 4 choices
  correctAnswer: string;
  weakTag?: "pinyin" | "character" | "meaning";
}

/**
 * Fallback distractor arrays if deck has < 4 cards
 */
const FALLBACK_CHARACTERS = APP_CONFIG.QUIZ_FALLBACKS.CHARACTERS;
const FALLBACK_PINYINS = APP_CONFIG.QUIZ_FALLBACKS.PINYINS;
const FALLBACK_TRANSLATIONS = APP_CONFIG.QUIZ_FALLBACKS.TRANSLATIONS;

/**
 * Utility to shuffle an array randomly using Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate tone variations for a pinyin string
 */
function generateToneVariations(pinyin: string): string[] {
  if (!pinyin) return [];

  const toneMap: Record<string, string[]> = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    ā: ["á", "ǎ", "à"],
    á: ["ā", "ǎ", "à"],
    ǎ: ["ā", "á", "à"],
    à: ["ā", "á", "ǎ"],
    ē: ["é", "ě", "è"],
    é: ["ē", "ě", "è"],
    ě: ["ē", "é", "è"],
    è: ["ē", "é", "ě"],
    ī: ["í", "ǐ", "ì"],
    í: ["ī", "ǐ", "ì"],
    ǐ: ["ī", "í", "ì"],
    ì: ["ī", "í", "ǐ"],
    ō: ["ó", "ǒ", "ò"],
    ó: ["ō", "ǒ", "ò"],
    ǒ: ["ō", "ó", "ò"],
    ò: ["ō", "ó", "ǒ"],
    ū: ["ú", "ǔ", "ù"],
    ú: ["ū", "ǔ", "ù"],
    ǔ: ["ū", "ú", "ù"],
    ù: ["ū", "ú", "ǔ"],
  };

  const variations: string[] = [];
  for (const [vowel, altTones] of Object.entries(toneMap)) {
    if (pinyin.includes(vowel)) {
      for (const alt of altTones) {
        const replaced = pinyin.replace(vowel, alt);
        if (replaced !== pinyin && !variations.includes(replaced)) {
          variations.push(replaced);
        }
      }
    }
  }
  return variations;
}

/**
 * Generate 3 distractors for Character options
 */
function getCharacterDistractors(card: Card, allCards: Card[]): string[] {
  const target = card.character || "";
  const uniquePool = Array.from(
    new Set(allCards.map((c) => c.character).filter((ch) => ch && ch !== target)),
  );

  for (const fallback of FALLBACK_CHARACTERS) {
    if (uniquePool.length >= 10) break;
    if (fallback !== target && !uniquePool.includes(fallback)) {
      uniquePool.push(fallback);
    }
  }

  const shuffled = shuffleArray(uniquePool);
  return shuffled.slice(0, 3);
}

/**
 * Generate 3 distractors for Vietnamese Translation options
 */
function getTranslationDistractors(card: Card, allCards: Card[]): string[] {
  const target = card.translation || "";
  const uniquePool = Array.from(
    new Set(allCards.map((c) => c.translation).filter((tr) => tr && tr !== target)),
  );

  for (const fallback of FALLBACK_TRANSLATIONS) {
    if (uniquePool.length >= 10) break;
    if (fallback !== target && !uniquePool.includes(fallback)) {
      uniquePool.push(fallback);
    }
  }

  const shuffled = shuffleArray(uniquePool);
  return shuffled.slice(0, 3);
}

/**
 * Generate 3 distractors for Pinyin options
 */
function getPinyinDistractors(card: Card, allCards: Card[]): string[] {
  const target = card.pinyin || "";
  const distractors: string[] = [];

  const toneVars = generateToneVariations(target);
  for (const tv of shuffleArray(toneVars)) {
    if (tv && tv !== target && !distractors.includes(tv)) {
      distractors.push(tv);
    }
    if (distractors.length >= 3) break;
  }

  if (distractors.length < 3) {
    const otherPinyins = Array.from(
      new Set(
        allCards
          .map((c) => c.pinyin)
          .filter((py) => py && py !== target && !distractors.includes(py)),
      ),
    );

    for (const py of shuffleArray(otherPinyins)) {
      distractors.push(py);
      if (distractors.length >= 3) break;
    }
  }

  if (distractors.length < 3) {
    for (const fb of FALLBACK_PINYINS) {
      if (fb !== target && !distractors.includes(fb)) {
        distractors.push(fb);
      }
      if (distractors.length >= 3) break;
    }
  }

  return distractors.slice(0, 3);
}

/**
 * Select question type adaptively based on FSRS state & weak tag with healthy variety:
 */
export function determineQuestionType(
  card: Card,
  weakTag?: "pinyin" | "character" | "meaning",
): QuestionType {
  if (weakTag === "pinyin") return "pinyin_choice";
  if (weakTag === "meaning") return "meaning_choice";
  if (weakTag === "character") return "listening";

  const state = card.srs?.state ?? FSRSState.New;
  const reps = card.srs?.repetitions ?? 0;
  const hasExamples = Boolean(card.examples && card.examples.length > 0 && card.examples[0].chinese);

  if (state === FSRSState.New) {
    return "meaning_choice";
  } else if (state === FSRSState.Learning || state === FSRSState.Relearning) {
    return "pinyin_choice";
  } else if (state === FSRSState.Review) {
    if (hasExamples && reps >= 3) {
      return "cloze";
    }
    return "listening";
  }

  return "meaning_choice";
}

/**
 * Generate a complete QuizQuestion for a card given all deck cards
 */
export function generateQuizQuestion(
  card: Card,
  allCards: Card[],
  forcedType?: QuestionType,
  weakTag?: "pinyin" | "character" | "meaning",
): QuizQuestion {
  const type = forcedType || determineQuestionType(card, weakTag);

  // 1. Chữ Hán -> Chọn nghĩa Tiếng Việt
  if (type === "meaning_choice") {
    const distractors = getTranslationDistractors(card, allCards);
    const options = shuffleArray(Array.from(new Set([card.translation, ...distractors])));

    return {
      card,
      type: "meaning_choice",
      prompt: "Chọn nghĩa Tiếng Việt của từ Hán tự này:",
      targetText: card.character,
      subText: card.pinyin || undefined,
      options,
      correctAnswer: card.translation,
    };
  }

  // 2. Nghĩa Tiếng Việt -> Chọn Chữ Hán
  if (type === "hanzi_from_meaning") {
    const distractors = getCharacterDistractors(card, allCards);
    const options = shuffleArray(Array.from(new Set([card.character, ...distractors])));

    return {
      card,
      type: "hanzi_from_meaning",
      prompt: "Chọn Chữ Hán tương ứng với nghĩa Tiếng Việt:",
      targetText: card.translation,
      subText: card.pinyin ? `Pinyin: ${card.pinyin}` : undefined,
      options,
      correctAnswer: card.character,
    };
  }

  // 3. Pinyin -> Chọn Chữ Hán
  if (type === "hanzi_from_pinyin") {
    const distractors = getCharacterDistractors(card, allCards);
    const options = shuffleArray(Array.from(new Set([card.character, ...distractors])));

    return {
      card,
      type: "hanzi_from_pinyin",
      prompt: "Chọn Chữ Hán tương ứng với phiên âm Pinyin:",
      targetText: card.pinyin,
      subText: card.translation ? `Nghĩa: ${card.translation}` : undefined,
      options,
      correctAnswer: card.character,
    };
  }

  // 4. Nghe âm thanh -> Chọn nghĩa Tiếng Việt
  if (type === "listening_meaning") {
    const distractors = getTranslationDistractors(card, allCards);
    const options = shuffleArray(Array.from(new Set([card.translation, ...distractors])));

    return {
      card,
      type: "listening_meaning",
      prompt: "Nghe phát âm và chọn Nghĩa Tiếng Việt đúng:",
      audioText: card.character,
      options,
      correctAnswer: card.translation,
    };
  }

  // 5. Điền khuyết câu ví dụ (Cloze)
  if (type === "cloze" && card.examples && card.examples.length > 0) {
    const ex = card.examples[0];
    if (ex.chinese) {
      let targetToReplace = "";
      if (ex.chinese.includes(card.character)) {
        targetToReplace = card.character;
      } else {
        // Fallback: check if individual characters match
        for (const char of card.character) {
          if (char.trim() && ex.chinese.includes(char)) {
            targetToReplace = char;
            break;
          }
        }
      }

      if (targetToReplace) {
        const blankedChinese = ex.chinese.replaceAll(targetToReplace, "（___）");
        const distractors = getCharacterDistractors(card, allCards);
        const options = shuffleArray(Array.from(new Set([card.character, ...distractors])));

        return {
          card,
          type: "cloze",
          prompt: "Điền từ thích hợp vào ô trống trong câu:",
          clozeSentence: blankedChinese,
          clozeTranslation: ex.vietnamese,
          options,
          correctAnswer: card.character,
        };
      }
    }
  }

  // 6. Nghe phát âm -> Chọn Chữ Hán
  if (type === "listening") {
    const distractors = getCharacterDistractors(card, allCards);
    const options = shuffleArray(Array.from(new Set([card.character, ...distractors])));

    return {
      card,
      type: "listening",
      prompt: "Nghe phát âm và chọn Chữ Hán đúng:",
      audioText: card.character,
      subText: card.translation || undefined,
      options,
      correctAnswer: card.character,
    };
  }

  // 7. Default: Chọn Pinyin & thanh điệu
  const distractors = getPinyinDistractors(card, allCards);
  const options = shuffleArray(Array.from(new Set([card.pinyin, ...distractors])));

  return {
    card,
    type: "pinyin_choice",
    prompt: "Chọn Phiên âm Pinyin & Thanh điệu đúng:",
    targetText: card.character,
    subText: card.translation,
    options,
    correctAnswer: card.pinyin,
  };
}
