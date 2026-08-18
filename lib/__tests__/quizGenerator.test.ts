import {
  determineQuestionType,
  generateQuizQuestion,
} from "../quizGenerator";
import { Card } from "../../store/slices/types";
import { FSRSState, createDefaultSRSState } from "../srs";

function assertStrictEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}. ${message || ""}`);
  }
}

function assertOk(value: unknown, message?: string) {
  if (!value) {
    throw new Error(`Assertion failed: value is falsy. ${message || ""}`);
  }
}

const mockCard1: Card = {
  id: "card_1",
  deckId: "deck_test",
  character: "猫",
  pinyin: "māo",
  translation: "Con mèo",
  examples: [{ chinese: "我有一只猫。", pinyin: "wǒ yǒu yī zhī māo.", vietnamese: "Tôi có một con mèo." }],
  srs: { ...createDefaultSRSState(), state: FSRSState.New },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCard2: Card = {
  id: "card_2",
  deckId: "deck_test",
  character: "狗",
  pinyin: "gǒu",
  translation: "Con chó",
  examples: [{ chinese: "这是一只狗。", pinyin: "zhè shì yī zhī gǒu.", vietnamese: "Đây là một con chó." }],
  srs: { ...createDefaultSRSState(), state: FSRSState.Learning },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCard3: Card = {
  id: "card_3",
  deckId: "deck_test",
  character: "喝水",
  pinyin: "hē shuǐ",
  translation: "Uống nước",
  examples: [{ chinese: "我想喝水。", pinyin: "wǒ xiǎng hē shuǐ.", vietnamese: "Tôi muốn uống nước." }],
  srs: { ...createDefaultSRSState(), state: FSRSState.Review, repetitions: 3 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const allCards = [mockCard1, mockCard2, mockCard3];

export function runQuizGeneratorTests() {
  // Test 1: Question type selection based on FSRS state
  assertStrictEqual(
    determineQuestionType(mockCard1),
    "meaning_choice",
    "New card should default to meaning_choice",
  );

  assertStrictEqual(
    determineQuestionType(mockCard2),
    "pinyin_choice",
    "Learning card should default to pinyin_choice",
  );

  assertStrictEqual(
    determineQuestionType(mockCard3),
    "cloze",
    "Review card with examples and reps >= 3 should use cloze test",
  );

  // Test 2: Weak tag override
  assertStrictEqual(
    determineQuestionType(mockCard1, "pinyin"),
    "pinyin_choice",
    "Weak tag pinyin should force pinyin_choice",
  );
  assertStrictEqual(
    determineQuestionType(mockCard1, "character"),
    "listening",
    "Weak tag character should force listening",
  );

  // Test 3: Meaning Choice Question Generation
  const qMeaning = generateQuizQuestion(mockCard1, allCards, "meaning_choice");
  assertOk(qMeaning, "QuizQuestion should be generated");
  assertStrictEqual(qMeaning.correctAnswer, "Con mèo", "Correct answer must match translation");
  assertStrictEqual(qMeaning.options.length, 4, "Should have exactly 4 choices");
  assertOk(qMeaning.options.includes("Con mèo"), "Choices must include correct answer");
  // Check uniqueness of options
  const uniqueMeaningOptions = new Set(qMeaning.options);
  assertStrictEqual(uniqueMeaningOptions.size, 4, "All 4 choices must be unique");

  // Test 4: Pinyin Choice Question Generation
  const qPinyin = generateQuizQuestion(mockCard1, allCards, "pinyin_choice");
  assertStrictEqual(qPinyin.correctAnswer, "māo");
  assertStrictEqual(qPinyin.options.length, 4);
  assertOk(qPinyin.options.includes("māo"));
  const uniquePinyinOptions = new Set(qPinyin.options);
  assertStrictEqual(uniquePinyinOptions.size, 4, "All 4 Pinyin choices must be unique");

  // Test 5: Cloze Question Generation
  const qCloze = generateQuizQuestion(mockCard3, allCards, "cloze");
  assertStrictEqual(qCloze.type, "cloze");
  assertStrictEqual(qCloze.correctAnswer, "喝水");
  assertOk(qCloze.clozeSentence?.includes("（___）"), "Sentence must have blank placeholder");
  assertOk(!qCloze.clozeSentence?.includes("喝水"), "Target keyword must be masked out");
  assertStrictEqual(new Set(qCloze.options).size, 4, "All cloze options must be unique");
}
