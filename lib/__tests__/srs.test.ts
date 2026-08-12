import { calculateSRS, createDefaultSRSState, SRS_GRADES, isDue, SRS_CONFIG } from "../srs";

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

export function runSRSTests() {
  // Test 1: default state
  const defaultState = createDefaultSRSState();
  assertStrictEqual(defaultState.repetitions, 0, "repetitions should be 0");
  assertStrictEqual(defaultState.interval, 0, "interval should be 0");
  assertStrictEqual(defaultState.easeFactor, 2.5, "easeFactor should be 2.5");
  assertOk(typeof defaultState.dueDate === "string", "dueDate should be string");

  // Test 2: AGAIN grade
  const initial = { repetitions: 3, interval: 10, easeFactor: 2.5, dueDate: new Date().toISOString() };
  const nextAgain = calculateSRS(SRS_GRADES.AGAIN, initial);
  assertStrictEqual(nextAgain.repetitions, 0, "AGAIN resets reps");
  assertStrictEqual(nextAgain.interval, 0, "AGAIN resets interval");
  assertStrictEqual(nextAgain.easeFactor, 2.5 - SRS_CONFIG.AGAIN_EASE_PENALTY, "AGAIN lowers ease factor");

  // Test 3: HARD grade
  const nextHard = calculateSRS(SRS_GRADES.HARD, initial);
  assertStrictEqual(nextHard.repetitions, 2, "HARD reduces reps by 1");
  assertStrictEqual(nextHard.interval, 1, "HARD sets interval to 1");

  // Test 4: GOOD grade
  const firstGood = calculateSRS(SRS_GRADES.GOOD, createDefaultSRSState());
  assertStrictEqual(firstGood.repetitions, 1);
  assertStrictEqual(firstGood.interval, 1);

  const secondGood = calculateSRS(SRS_GRADES.GOOD, firstGood);
  assertStrictEqual(secondGood.repetitions, 2);
  assertStrictEqual(secondGood.interval, 3);

  // Test 5: EASY grade
  const firstEasy = calculateSRS(SRS_GRADES.EASY, createDefaultSRSState());
  assertStrictEqual(firstEasy.repetitions, 1);
  assertStrictEqual(firstEasy.interval, 1);
  assertStrictEqual(firstEasy.easeFactor, 2.65);

  // Test 6: isDue comparison
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  assertStrictEqual(isDue({ repetitions: 1, interval: 1, easeFactor: 2.5, dueDate: pastDate.toISOString() }), true);

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  assertStrictEqual(isDue({ repetitions: 1, interval: 5, easeFactor: 2.5, dueDate: futureDate.toISOString() }), false);
}

