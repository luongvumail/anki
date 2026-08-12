import { APP_CONFIG } from "../constants/config";

export const SRS_CONFIG = {
  AGAIN_EASE_PENALTY: 0.2,
  HARD_EASE_PENALTY: 0.15,
  EASY_EASE_BONUS: 0.15,
  EASY_INTERVAL_MULTIPLIER: 1.3,
  INITIAL_GOOD_INTERVAL: 1,
  SECOND_GOOD_INTERVAL: 3,
  INITIAL_EASY_INTERVAL: 1,
  SECOND_EASY_INTERVAL: 6,
} as const;

export const SRS_GRADES = {
  AGAIN: 1, // Quên — reset interval = 0, Ease Factor -0.20
  HARD: 2,  // Khó — interval = 1d, Ease Factor -0.15
  GOOD: 3,  // Tốt — interval tăng mượt (1d -> 3d -> interval * EF), Ease Factor +0.00
  EASY: 4,  // Dễ — interval vượt cấp (1d -> 6d -> interval * EF * 1.3), Ease Factor +0.15
} as const;

export type SRSGrade = (typeof SRS_GRADES)[keyof typeof SRS_GRADES];

export interface SRSState {
  repetitions: number;
  interval: number; // days
  easeFactor: number; // default 2.5
  dueDate: string; // ISO date string
}

export function createDefaultSRSState(): SRSState {
  return {
    repetitions: 0,
    interval: 0,
    easeFactor: APP_CONFIG.DEFAULT_EASE_FACTOR,
    dueDate: new Date().toISOString(),
  };
}

/**
 * Calculates the next SRS state based on 4 Anki grades (AGAIN, HARD, GOOD, EASY).
 */
export function calculateSRS(grade: SRSGrade, current: SRSState): SRSState {
  let repetitions = current?.repetitions ?? 0;
  let interval = current?.interval ?? 0;
  let easeFactor = current?.easeFactor ?? APP_CONFIG.DEFAULT_EASE_FACTOR;

  if (easeFactor < APP_CONFIG.MIN_EASE_FACTOR) easeFactor = APP_CONFIG.MIN_EASE_FACTOR;

  if (grade === SRS_GRADES.AGAIN) {
    // Quên: Reset streak, ôn lại ngay trong phiên (interval = 0)
    repetitions = 0;
    interval = 0;
    easeFactor -= SRS_CONFIG.AGAIN_EASE_PENALTY;
  } else if (grade === SRS_GRADES.HARD) {
    // Khó (vừa mới sai / làm lại trong phiên): interval = 1d
    repetitions = Math.max(0, repetitions - 1);
    interval = 1;
    easeFactor -= SRS_CONFIG.HARD_EASE_PENALTY;
  } else if (grade === SRS_GRADES.GOOD) {
    // Tốt (Đúng lần đầu nhưng do dự > 3.5s): tăng mượt 1d -> 3d -> interval * EF
    if (repetitions === 0) {
      interval = SRS_CONFIG.INITIAL_GOOD_INTERVAL;
    } else if (repetitions === 1) {
      interval = SRS_CONFIG.SECOND_GOOD_INTERVAL;
    } else {
      interval = Math.ceil(interval * easeFactor);
    }
    repetitions += 1;
    // Ease factor unchanged (+0.00)
  } else if (grade === SRS_GRADES.EASY) {
    // Dễ (Đúng lần đầu & Phản xạ nhanh <= 3.5s): tăng tốc 1d -> 6d -> interval * EF * 1.3
    if (repetitions === 0) {
      interval = SRS_CONFIG.INITIAL_EASY_INTERVAL;
    } else if (repetitions === 1) {
      interval = SRS_CONFIG.SECOND_EASY_INTERVAL;
    } else {
      interval = Math.ceil(interval * easeFactor * SRS_CONFIG.EASY_INTERVAL_MULTIPLIER);
    }
    repetitions += 1;
    easeFactor += SRS_CONFIG.EASY_EASE_BONUS;
  }

  if (easeFactor < APP_CONFIG.MIN_EASE_FACTOR) easeFactor = APP_CONFIG.MIN_EASE_FACTOR;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  dueDate.setHours(0, 0, 0, 0);

  return {
    repetitions,
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    dueDate: dueDate.toISOString(),
  };
}

/**
 * Returns true if the card is due for review today or overdue.
 */
export function isDue(srs: SRSState): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(srs.dueDate);
  due.setHours(0, 0, 0, 0);
  return due <= today;
}

/**
 * Returns a human-readable next-interval label for SRS buttons/badges.
 */
export function getIntervalLabel(grade: SRSGrade, current: SRSState): string {
  const next = calculateSRS(grade, current);
  if (next.interval === 0) return "Ôn lại ngay";
  if (next.interval === 1) return "1 ngày";
  if (next.interval < 7) return `${next.interval} ngày`;
  if (next.interval < 30) return `${Math.round(next.interval / 7)} tuần`;
  if (next.interval < 365) return `${Math.round(next.interval / 30)} tháng`;
  return `${Math.round(next.interval / 365)} năm`;
}

/**
 * Calculates SRS state from objective Quiz performance metrics using the 4-level Anki Model:
 * 1. AGAIN: Incorrect answer
 * 2. HARD: Correct on retry (after previous mistake in same session)
 * 3. GOOD: Correct on 1st attempt, but slow response (> 3.5 seconds)
 * 4. EASY: Correct on 1st attempt with fast response (<= 3.5 seconds)
 */
export function calculateQuizSRS(
  isCorrect: boolean,
  isRetry: boolean,
  responseTimeMs: number,
  current: SRSState
): { newSRS: SRSState; grade: SRSGrade } {
  let grade: SRSGrade;

  if (!isCorrect) {
    grade = SRS_GRADES.AGAIN;
  } else if (isRetry) {
    grade = SRS_GRADES.HARD;
  } else if (responseTimeMs > APP_CONFIG.SLOW_RESPONSE_THRESHOLD_MS) {
    grade = SRS_GRADES.GOOD;
  } else {
    grade = SRS_GRADES.EASY;
  }

  const newSRS = calculateSRS(grade, current);
  return { newSRS, grade };
}
