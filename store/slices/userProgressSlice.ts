import { StateCreator } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProgressState, Badge } from "./types";

const ASYNC_KEY_XP = "@anki_user_xp";
const ASYNC_KEY_BADGES = "@anki_user_badges";

export function getLevelInfo(xp: number) {
  let level = Math.floor(xp / 100) + 1;
  let title = "初学者"; // Tân thủ
  let titleVi = "Người mới bắt đầu";

  if (level >= 51) {
    title = "汉字宗师";
    titleVi = "Tông sư Chữ Hán";
  } else if (level >= 31) {
    title = "汉语大师";
    titleVi = "Đại sư Hán ngữ";
  } else if (level >= 16) {
    title = "汉语达人";
    titleVi = "Cao thủ Hán ngữ";
  } else if (level >= 6) {
    title = "汉语学徒";
    titleVi = "Học đồ Hán ngữ";
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

export const ALL_BADGES: Omit<Badge, "current" | "unlocked">[] = [
  {
    id: "streak_3",
    title: "Tia Lửa Đầu Tiên",
    description: "Đạt chuỗi 3 ngày học liên tục",
    icon: "flame",
    category: "streak",
    target: 3,
  },
  {
    id: "streak_7",
    title: "Rực Rỡ 7 Ngày",
    description: "Đạt chuỗi 7 ngày học liên tục",
    icon: "flash",
    category: "streak",
    target: 7,
  },
  {
    id: "streak_30",
    title: "Ngọn Lửa Kiên Trì",
    description: "Đạt chuỗi 30 ngày học liên tục",
    icon: "bonfire",
    category: "streak",
    target: 30,
  },
  {
    id: "vocab_20",
    title: "Hạt Mầm Hán Tự",
    description: "Ghi nhớ thuộc 20 từ vựng",
    icon: "leaf",
    category: "vocab",
    target: 20,
  },
  {
    id: "vocab_100",
    title: "Khu Vườn Từ Vựng",
    description: "Ghi nhớ thuộc 100 từ vựng",
    icon: "flower",
    category: "vocab",
    target: 100,
  },
  {
    id: "vocab_500",
    title: "Cây Cổ Thụ HSK",
    description: "Ghi nhớ thuộc 500 từ vựng",
    icon: "tree",
    category: "vocab",
    target: 500,
  },
  {
    id: "speed_15",
    title: "Tay Nhanh Hơn Mắt",
    description: "Ghép được 15 cặp từ trong Game 60s",
    icon: "stopwatch",
    category: "speed",
    target: 15,
  },
  {
    id: "speed_25",
    title: "Bậc Thầy Tốc Độ",
    description: "Ghép được 25 cặp từ trong Game 60s",
    icon: "trophy",
    category: "speed",
    target: 25,
  },
  {
    id: "ai_50",
    title: "Khai Thác AI",
    description: "Nạp 50 từ vựng bằng Gemini AI",
    icon: "sparkles",
    category: "ai",
    target: 50,
  },
];

export const createUserProgressSlice: StateCreator<UserProgressState> = (set, get) => ({
  xp: 0,
  unlockedBadgeIds: [],

  fetchUserProgress: async () => {
    try {
      const xpStr = await AsyncStorage.getItem(ASYNC_KEY_XP);
      const badgesJson = await AsyncStorage.getItem(ASYNC_KEY_BADGES);

      const xp = xpStr ? parseInt(xpStr, 10) : 0;
      const unlockedBadgeIds: string[] = badgesJson ? JSON.parse(badgesJson) : [];

      set({ xp, unlockedBadgeIds });
    } catch {
      // ignore
    }
  },

  addXP: async (amount: number) => {
    const newXP = get().xp + amount;
    set({ xp: newXP });
    await AsyncStorage.setItem(ASYNC_KEY_XP, newXP.toString());
  },

  checkAndUnlockBadges: async () => {
    // Can be invoked after actions to check unlocked criteria
  },
});
