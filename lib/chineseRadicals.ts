/**
 * Utility for formatting or parsing Chinese radical character breakdowns.
 */
export function formatRadicalInfo(radical?: string): string {
  if (!radical || !radical.trim()) return "Chưa có phân tích bộ thủ";
  return radical.trim();
}
