export interface StreakState {
  currentStreak: number;
  lastActiveDate: string | null;
  isActiveToday: boolean;
}

/**
 * Streak Calculator
 * Pure domain logic for calculating consecutive study days.
 */
export function calculateStreak(activityDates: string[]): number {
  if (!activityDates || activityDates.length === 0) return 0;

  // Normalize dates to YYYY-MM-DD set (unique days)
  const uniqueDays = new Set(
    activityDates.map((dateStr) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;
    }),
  );

  const today = new Date();
  const getFormatted = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
      2,
      "0",
    )}`;

  let streak = 0;
  let currentDate = new Date(today);

  // If user hasn't studied today yet, check if studied yesterday to keep streak
  if (!uniqueDays.has(getFormatted(currentDate))) {
    currentDate.setDate(currentDate.getDate() - 1);
    if (!uniqueDays.has(getFormatted(currentDate))) {
      return 0; // Missed yesterday and today -> streak reset
    }
  }

  // Count backwards day by day
  while (uniqueDays.has(getFormatted(currentDate))) {
    streak += 1;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}
