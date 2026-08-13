import { Card } from "../store/slices/types";
import { APP_CONFIG } from "../constants/config";

export type QuestionType = "meaning_choice" | "pinyin_choice" | "listening" | "cloze";

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
 * Utility to shuffle an array randomly
 */
function shuffleArray<T>(array: T[]): T[] {
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
 * Select question type adaptively based on FSRS repetitions & weak tag:
 */
export function determineQuestionType(
  card: Card,
  weakTag?: "pinyin" | "character" | "meaning",
): QuestionType {
  if (weakTag === "pinyin") return "pinyin_choice";
  if (weakTag === "meaning") return "meaning_choice";
  if (weakTag === "character") return "listening";

  const reps = card.srs?.repetitions ?? 0;
  const hasExamples = card.examples && card.examples.length > 0 && card.examples[0].chinese;

  if (reps === 0) {
    return "meaning_choice";
  } else if (reps <= 2) {
    return "pinyin_choice";
  } else if (reps <= 4) {
    return "listening";
  } else if (hasExamples) {
    return "cloze";
  } else {
    return "meaning_choice";
  }
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
        const blankedChinese = ex.chinese.replaceAll(targetToReplace, " [ _____ ] ");
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

  // Default: Pinyin Choice
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
