import { Rating } from "../fsrs/fsrsTypes.js";

export const XP_PER_RATING: Record<Rating, number> = {
  [Rating.Again]: 5,
  [Rating.Hard]: 10,
  [Rating.Good]: 15,
  [Rating.Easy]: 20,
};

export interface UserProgress {
  totalXp: number;
  level: number;
  streakDays: number;
  lastStudyDate: string | null;
  badges: string[];
  dailyGoal: number;
  streakFreezeCount: number;
}

export const initialUserProgress: UserProgress = {
  totalXp: 0,
  level: 1,
  streakDays: 1,
  lastStudyDate: null,
  badges: [],
  dailyGoal: 10,
  streakFreezeCount: 2,
};

export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return Math.floor(totalXp / 100) + 1;
}

export function getXpForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "vocab" | "speed" | "ai";
  target: number;
}

export function getLevelInfo(xp: number) {
  let level = Math.floor(xp / 100) + 1;
  let title = "初学者";
  let titleVi = "Người mới bắt đầu";

  if (level >= 81) {
    title = "汉字宗师";
    titleVi = "Tông sư Hán tự";
  } else if (level >= 51) {
    title = "汉语达人";
    titleVi = "Cao thủ Hán ngữ";
  } else if (level >= 31) {
    title = "通语者";
    titleVi = "Thông thạo Ngữ cảnh";
  } else if (level >= 16) {
    title = "积词人";
    titleVi = "Tích lũy Từ vựng";
  } else if (level >= 6) {
    title = "识字生";
    titleVi = "Học viên Nhận chữ";
  }

  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const progress = Math.min(1, Math.max(0, (xp - currentLevelXP) / 100));

  return {
    level,
    title,
    titleVi,
    currentLevelXP,
    nextLevelXP,
    progress,
  };
}

export const ALL_BADGES: Badge[] = [
  {
    id: "streak_3",
    title: "Tia Lửa Đầu Tiên",
    description: "Duy trì chuỗi 3 ngày học liên tục",
    icon: "zap",
    category: "streak",
    target: 3,
  },
  {
    id: "streak_7",
    title: "Rực Rỡ 7 Ngày",
    description: "Duy trì chuỗi 7 ngày học liên tục",
    icon: "zap",
    category: "streak",
    target: 7,
  },
  {
    id: "streak_30",
    title: "Bền Bỉ 30 Ngày",
    description: "Duy trì chuỗi 30 ngày học liên tục",
    icon: "zap",
    category: "streak",
    target: 30,
  },
  {
    id: "vocab_10",
    title: "Khởi Đầu Hán Ngữ",
    description: "Thuộc 10 từ vựng đầu tiên",
    icon: "book",
    category: "vocab",
    target: 10,
  },
  {
    id: "vocab_50",
    title: "Vốn Từ Phong Phú",
    description: "Thuộc 50 từ vựng Hán tự",
    icon: "book",
    category: "vocab",
    target: 50,
  },
  {
    id: "vocab_100",
    title: "Bách Khoa Hán Nhận",
    description: "Thuộc 100 từ vựng Hán tự",
    icon: "trophy",
    category: "vocab",
    target: 100,
  },
];

