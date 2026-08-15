import { getLevelInfo, ALL_BADGES } from "../levelSystem";

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

export function runUserProgressTests() {
  // Test 1: Level 1 (0 XP)
  const l1 = getLevelInfo(0);
  assertStrictEqual(l1.level, 1, "0 XP should be Level 1");
  assertStrictEqual(l1.title, "初学者", "Level 1 title should be 初学者");
  assertStrictEqual(l1.progress, 0, "Progress at 0 XP should be 0");
  assertStrictEqual(l1.nextLevelXP, 100);

  // Test 2: Level 2 with partial progress (150 XP)
  const l2 = getLevelInfo(150);
  assertStrictEqual(l2.level, 2, "150 XP should be Level 2");
  assertStrictEqual(l2.currentLevelXP, 100);
  assertStrictEqual(l2.nextLevelXP, 200);
  assertStrictEqual(l2.progress, 0.5, "50/100 should be 0.5 progress");

  // Test 3: Master Tier (Level 81+, 8000+ XP)
  const master = getLevelInfo(8500);
  assertStrictEqual(master.level, 86);
  assertStrictEqual(master.title, "汉字宗师", "8000+ XP should have 汉字宗师 title");

  // Test 4: Badges Structure Validation
  assertOk(ALL_BADGES.length >= 20, "Should have at least 20 achievement badges");
  const badgeIds = new Set<string>();
  ALL_BADGES.forEach((b) => {
    assertOk(b.id, "Badge must have an id");
    assertOk(b.title, "Badge must have a title");
    assertOk(b.target > 0, "Badge target must be > 0");
    assertStrictEqual(badgeIds.has(b.id), false, `Duplicate badge ID: ${b.id}`);
    badgeIds.add(b.id);
  });
}
