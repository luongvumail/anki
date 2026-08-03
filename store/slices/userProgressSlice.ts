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
    icon: "planet",
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
    description: "Nạp 50 từ vựng bằng AI",
    icon: "sparkles",
    category: "ai",
    target: 50,
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
