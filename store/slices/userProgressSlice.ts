import { StateCreator } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoc, setDoc } from "firebase/firestore";
import { auth } from "../../lib/firebase";
import { userProgressRef } from "./firestoreHelpers";
import { UserProgressState, Badge } from "./types";

const ASYNC_KEY_XP = "@anki_user_xp";
const ASYNC_KEY_BADGES = "@anki_user_badges";

export function getLevelInfo(xp: number) {
  let level = Math.floor(xp / 100) + 1;
  let title = "初学者"; // Người mới bắt đầu
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

export const ALL_BADGES: Omit<Badge, "current" | "unlocked">[] = [
  // Streak Category
  {
    id: "streak_3",
    title: "Tia Lửa Đầu Tiên",
    description: "Duy trì chuỗi 3 ngày học liên tục",
    icon: "flame",
    category: "streak",
    target: 3,
  },
  {
    id: "streak_7",
    title: "Rực Rỡ 7 Ngày",
    description: "Duy trì chuỗi 7 ngày học liên tục",
    icon: "flash",
    category: "streak",
    target: 7,
  },
  {
    id: "streak_30",
    title: "Chiến Binh Kiên Trì",
    description: "Duy trì chuỗi 30 ngày học liên tục",
    icon: "bonfire",
    category: "streak",
    target: 30,
  },
  {
    id: "streak_100",
    title: "Huyền Thoại Bất Tận",
    description: "Duy trì chuỗi 100 ngày học liên tục",
    icon: "ribbon",
    category: "streak",
    target: 100,
  },

  // Vocab Category
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
    title: "Vốn Từ Nền Tảng",
    description: "Ghi nhớ thuộc 100 từ vựng",
    icon: "flower",
    category: "vocab",
    target: 100,
  },
  {
    id: "vocab_300",
    title: "Bàn Đạp HSK 3",
    description: "Ghi nhớ thuộc 300 từ vựng",
    icon: "book",
    category: "vocab",
    target: 300,
  },
  {
    id: "vocab_1000",
    title: "Kho Từ Vạn Chữ",
    description: "Ghi nhớ thuộc 1,000 từ vựng",
    icon: "planet",
    category: "vocab",
    target: 1000,
  },

  // Speed Category
  {
    id: "speed_15",
    title: "Phản Xạ Nhanh",
    description: "Ghép đúng 15 cặp từ trong Game 60s",
    icon: "stopwatch",
    category: "speed",
    target: 15,
  },
  {
    id: "speed_25",
    title: "Tốc Độ Cao",
    description: "Ghép đúng 25 cặp từ trong Game 60s",
    icon: "speedometer",
    category: "speed",
    target: 25,
  },
  {
    id: "speed_40",
    title: "Bậc Thầy Tốc Độ",
    description: "Ghép đúng 40 cặp từ trong Game 60s",
    icon: "trophy",
    category: "speed",
    target: 40,
  },

  // AI Creation Category
  {
    id: "ai_10",
    title: "Khám Phá AI",
    description: "Tạo 10 từ vựng bằng AI",
    icon: "sparkles",
    category: "ai",
    target: 10,
  },
  {
    id: "ai_50",
    title: "Khai Thác AI",
    description: "Tạo 50 từ vựng bằng AI",
    icon: "hardware-chip",
    category: "ai",
    target: 50,
  },
  {
    id: "ai_200",
    title: "Chuyên Gia Nạp AI",
    description: "Tạo 200 từ vựng bằng AI",
    icon: "planet-outline",
    category: "ai",
    target: 200,
  },
];

async function syncProgressToFirestore(xp: number, unlockedBadgeIds: string[]) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    await setDoc(
      userProgressRef(uid),
      {
        xp,
        unlockedBadgeIds,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("[userProgressSlice] Sync to Firestore failed:", e);
  }
}

export const createUserProgressSlice: StateCreator<UserProgressState> = (set, get) => ({
  xp: 0,
  unlockedBadgeIds: [],

  fetchUserProgress: async () => {
    try {
      let xp = 0;
      let unlockedBadgeIds: string[] = [];

      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const snap = await getDoc(userProgressRef(uid));
          if (snap.exists()) {
            const data = snap.data();
            xp = data.xp || 0;
            unlockedBadgeIds = data.unlockedBadgeIds || [];
          }
        } catch (fsErr) {
          console.warn("[userProgressSlice] Firestore read failed, using local storage:", fsErr);
        }
      }

      if (xp === 0 && unlockedBadgeIds.length === 0) {
        const xpStr = await AsyncStorage.getItem(ASYNC_KEY_XP);
        const badgesJson = await AsyncStorage.getItem(ASYNC_KEY_BADGES);
        xp = xpStr ? parseInt(xpStr, 10) : 0;
        unlockedBadgeIds = badgesJson ? JSON.parse(badgesJson) : [];
      }

      set({ xp, unlockedBadgeIds });
      await AsyncStorage.setItem(ASYNC_KEY_XP, xp.toString());
      await AsyncStorage.setItem(ASYNC_KEY_BADGES, JSON.stringify(unlockedBadgeIds));
    } catch {
      // ignore
    }
  },

  addXP: async (amount: number) => {
    const newXP = get().xp + amount;
    const badges = get().unlockedBadgeIds;
    set({ xp: newXP });
    await AsyncStorage.setItem(ASYNC_KEY_XP, newXP.toString());
    syncProgressToFirestore(newXP, badges);
  },

  unlockBadge: async (badgeId: string) => {
    const current = get().unlockedBadgeIds || [];
    if (!current.includes(badgeId)) {
      const updated = [...current, badgeId];
      const xp = get().xp;
      set({ unlockedBadgeIds: updated });
      await AsyncStorage.setItem(ASYNC_KEY_BADGES, JSON.stringify(updated));
      syncProgressToFirestore(xp, updated);
    }
  },

  checkAndUnlockBadges: async (streak = 0, learnedCards = 0) => {
    const current = get().unlockedBadgeIds || [];
    const newUnlocked = [...current];
    let changed = false;

    ALL_BADGES.forEach((badge) => {
      if (!newUnlocked.includes(badge.id)) {
        if (badge.category === "streak" && streak >= badge.target) {
          newUnlocked.push(badge.id);
          changed = true;
        } else if (badge.category === "vocab" && learnedCards >= badge.target) {
          newUnlocked.push(badge.id);
          changed = true;
        }
      }
    });

    if (changed) {
      const xp = get().xp;
      set({ unlockedBadgeIds: newUnlocked });
      await AsyncStorage.setItem(ASYNC_KEY_BADGES, JSON.stringify(newUnlocked));
      syncProgressToFirestore(xp, newUnlocked);
    }
  },
});
