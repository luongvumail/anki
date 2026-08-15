import { getPinyinToneColor, getToneLabel, TONE_NEON_COLORS } from "../pinyinColor";

function assertStrictEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}. ${message || ""}`);
  }
}

export function runPinyinColorTests() {
  // Test Tone 1 (Ngang) -> Cyan
  assertStrictEqual(getPinyinToneColor("mā"), TONE_NEON_COLORS.cyan);
  assertStrictEqual(getToneLabel("mā"), "Thanh 1 (Ngang)");

  // Test Tone 2 (Sắc) -> Emerald
  assertStrictEqual(getPinyinToneColor("má"), TONE_NEON_COLORS.emerald);
  assertStrictEqual(getToneLabel("má"), "Thanh 2 (Sắc)");

  // Test Tone 3 (Hỏi) -> Purple
  assertStrictEqual(getPinyinToneColor("mǎ"), TONE_NEON_COLORS.purple);
  assertStrictEqual(getToneLabel("mǎ"), "Thanh 3 (Hỏi)");

  // Test Tone 4 (Huyền / Nặng) -> Coral
  assertStrictEqual(getPinyinToneColor("mà"), TONE_NEON_COLORS.coral);
  assertStrictEqual(getToneLabel("mà"), "Thanh 4 (Huyền / Nặng)");

  // Test Neutral Tone -> Cyan default
  assertStrictEqual(getPinyinToneColor("ma"), TONE_NEON_COLORS.cyan);
  assertStrictEqual(getToneLabel("ma"), "Thanh nhẹ");
}
