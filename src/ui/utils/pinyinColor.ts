export function parseTone(pinyin: string): number {
  if (/[āēīōūǖ1]/.test(pinyin)) return 1;
  if (/[áéíóúǘ2]/.test(pinyin)) return 2;
  if (/[ǎěǐǒǔǚ3]/.test(pinyin)) return 3;
  if (/[àèìòùǜ4]/.test(pinyin)) return 4;
  return 0;
}

export function getPinyinColor(tone: number): string {
  switch (tone) {
    case 1:
      return "#3B82F6"; // Blue
    case 2:
      return "#10B981"; // Green
    case 3:
      return "#F59E0B"; // Orange
    case 4:
      return "#EF4444"; // Red
    default:
      return "#6B7280"; // Gray
  }
}
