import {
  calculateSRS,
  createDefaultSRSState,
  SRS_GRADES,
  isDue,
  FSRSState,
  calculateQuizSRS,
} from "../srs";

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
  // Test 1: Default FSRS state creation
  const defaultState = createDefaultSRSState();
  assertStrictEqual(defaultState.repetitions, 0, "repetitions should be 0");
  assertStrictEqual(defaultState.interval, 0, "interval should be 0");
  assertStrictEqual(defaultState.state, FSRSState.New, "state should be New (0)");
  assertOk(defaultState.stability > 0, "stability should be initialized");
  assertStrictEqual(defaultState.difficulty, 5.0, "difficulty should be 5.0");
  assertOk(typeof defaultState.dueDate === "string", "dueDate should be string");

  // Test 2: AGAIN grade (Forget)
  const initial = createDefaultSRSState();
  const nextAgain = calculateSRS(SRS_GRADES.AGAIN, initial);
  assertStrictEqual(nextAgain.repetitions, 0, "AGAIN resets reps");
  assertStrictEqual(nextAgain.interval, 0, "AGAIN resets interval for immediate review");
  assertStrictEqual(nextAgain.state, FSRSState.Learning, "New card gets Learning state on AGAIN");

  // Test 3: GOOD grade (Recall)
  const firstGood = calculateSRS(SRS_GRADES.GOOD, initial);
  assertStrictEqual(firstGood.repetitions, 1, "GOOD increases reps");
  assertOk(firstGood.interval >= 1, "GOOD interval should be >= 1 day");
  assertStrictEqual(firstGood.state, FSRSState.Review, "GOOD moves card to Review state");

  // Test 4: EASY grade (Fast recall boost)
  const firstEasy = calculateSRS(SRS_GRADES.EASY, initial);
  assertStrictEqual(firstEasy.repetitions, 1);
  assertOk(firstEasy.stability > firstGood.stability, "EASY stability should be higher than GOOD stability");

  // Test 5: Quiz Speed Evaluation
  // Fast response (<= 2500ms) -> EASY
  const fastEval = calculateQuizSRS(true, false, 1200, initial);
  assertStrictEqual(fastEval.grade, SRS_GRADES.EASY, "Fast response should yield EASY grade");
  assertStrictEqual(fastEval.speedCategory, "fast");

  // Normal response (3000ms) -> GOOD
  const normalEval = calculateQuizSRS(true, false, 3000, initial);
  assertStrictEqual(normalEval.grade, SRS_GRADES.GOOD, "Normal response should yield GOOD grade");
  assertStrictEqual(normalEval.speedCategory, "normal");

  // Slow response (6000ms) -> HARD
  const slowEval = calculateQuizSRS(true, false, 6000, initial);
  assertStrictEqual(slowEval.grade, SRS_GRADES.HARD, "Slow response should yield HARD grade");
  assertStrictEqual(slowEval.speedCategory, "slow");

  // Incorrect response -> AGAIN
  const wrongEval = calculateQuizSRS(false, false, 1500, initial);
  assertStrictEqual(wrongEval.grade, SRS_GRADES.AGAIN, "Incorrect answer should yield AGAIN grade");
  assertStrictEqual(wrongEval.speedCategory, "wrong");

  // Test 6: isDue comparison
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  assertStrictEqual(isDue({ repetitions: 1, interval: 1, easeFactor: 2.5, dueDate: pastDate.toISOString() }), true);

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  assertStrictEqual(isDue({ repetitions: 1, interval: 5, easeFactor: 2.5, dueDate: futureDate.toISOString() }), false);
}


