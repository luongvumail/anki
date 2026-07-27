/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * Ported to TypeScript for the Anki app.
 */

export const SRS_GRADES = {
  AGAIN: 1, // Quên — ôn lại ngay trong phiên (interval = 0)
  HARD: 3,  // Khó — ôn lại cuối phiên (interval = 1d)
  EASY: 5,  // Thuộc — nhớ tốt, hoàn thành phiên (interval scaling 1d -> 6d -> EF)
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
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  };
}

/**
 * Calculates the next SRS state based on the 3 simplified grades given.
 */
export function calculateSRS(grade: SRSGrade, current: SRSState): SRSState {
  let repetitions = current?.repetitions ?? 0;
  let interval = current?.interval ?? 0;
  let easeFactor = current?.easeFactor ?? 2.5;

  if (easeFactor < 1.3) easeFactor = 1.3;

  if (grade === SRS_GRADES.AGAIN) {
    // Quên: Reset streak, ôn lại ngay trong phiên (interval = 0)
    repetitions = 0;
    interval = 0;
    easeFactor -= 0.2;
  } else if (grade === SRS_GRADES.HARD) {
    // Khó: Giữ trong phiên ôn lại cuối bài, interval = 1d
    repetitions = Math.max(0, repetitions - 1);
    interval = 1;
    easeFactor -= 0.15;
  } else if (grade === SRS_GRADES.EASY) {
    // Thuộc: Đạt tiêu chuẩn hoàn thành bài, tăng interval chuẩn lặp ngắt quãng SM-2
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.ceil(interval * easeFactor);
    }
    repetitions += 1;
    easeFactor += 0.1;
  }

  if (easeFactor < 1.3) easeFactor = 1.3;

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
 * Returns a human-readable next-interval label for SRS buttons.
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
