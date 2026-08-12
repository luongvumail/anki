import { StateCreator } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoc, setDoc } from "firebase/firestore";
import { auth } from "../../lib/firebase";
import { userProgressRef } from "./firestoreHelpers";
import { UserProgressState, Badge } from "./types";
import { APP_CONFIG } from "../../constants/config";

const ASYNC_KEY_XP = "@anki_user_xp";
const ASYNC_KEY_BADGES = "@anki_user_badges";

const LEVEL_TIERS = [
  { minLevel: 81, title: "汉字宗师", titleVi: "Tông sư Hán tự" },
  { minLevel: 51, title: "汉语达人", titleVi: "Cao thủ Hán ngữ" },
  { minLevel: 31, title: "通语者", titleVi: "Thông thạo Ngữ cảnh" },
  { minLevel: 16, title: "积词人", titleVi: "Tích lũy Từ vựng" },
  { minLevel: 6, title: "识字生", titleVi: "Học viên Nhận chữ" },
  { minLevel: 1, title: "初学者", titleVi: "Người mới bắt đầu" },
] as const;

export function getLevelInfo(xp: number) {
  const level = Math.floor(xp / APP_CONFIG.XP_PER_LEVEL) + 1;
  const tier = LEVEL_TIERS.find((t) => level >= t.minLevel) ?? LEVEL_TIERS[LEVEL_TIERS.length - 1];

  const currentLevelXP = (level - 1) * APP_CONFIG.XP_PER_LEVEL;
  const nextLevelXP = level * APP_CONFIG.XP_PER_LEVEL;
  const progress = Math.min(1, Math.max(0, (xp - currentLevelXP) / APP_CONFIG.XP_PER_LEVEL));

  return {
    level,
    title: tier.title,
    titleVi: tier.titleVi,
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
    id: "streak_14",
    title: "Thói Quản Bền Vững",
    description: "Duy trì chuỗi 14 ngày học liên tục",
    icon: "shield-checkmark",
    category: "streak",
    target: 14,
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
    id: "streak_60",
    title: "Khí Phách Hán Ngữ",
    description: "Duy trì chuỗi 60 ngày học liên tục",
    icon: "medal",
    category: "streak",
    target: 60,
  },
  {
    id: "streak_100",
    title: "Huyền Thoại Bất Tận",
    description: "Duy trì chuỗi 100 ngày học liên tục",
    icon: "ribbon",
    category: "streak",
    target: 100,
  },
  {
    id: "streak_180",
    title: "Thép Đã Tôi Thế Đấy",
    description: "Duy trì chuỗi 180 ngày học liên tục",
    icon: "diamond",
    category: "streak",
    target: 180,
  },
  {
    id: "streak_365",
    title: "Thánh Chuỗi Bất Tử",
    description: "Chinh phục 365 ngày học liên tục (1 Năm)",
    icon: "trophy",
    category: "streak",
    target: 365,
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
    id: "vocab_50",
    title: "Khởi Đầu Vững Chắc",
    description: "Ghi nhớ thuộc 50 từ vựng",
    icon: "flower",
    category: "vocab",
    target: 50,
  },
  {
    id: "vocab_100",
    title: "Vốn Từ Nền Tảng",
    description: "Ghi nhớ thuộc 100 từ vựng",
    icon: "book",
    category: "vocab",
    target: 100,
  },
  {
    id: "vocab_250",
    title: "Chinh Phục HSK 2",
    description: "Ghi nhớ thuộc 250 từ vựng",
    icon: "library",
    category: "vocab",
    target: 250,
  },
  {
    id: "vocab_500",
    title: "Cột Mốc HSK 3",
    description: "Ghi nhớ thuộc 500 từ vựng",
    icon: "school",
    category: "vocab",
    target: 500,
  },
  {
    id: "vocab_1000",
    title: "Thông Thạo HSK 4",
    description: "Ghi nhớ thuộc 1,000 từ vựng",
    icon: "planet",
    category: "vocab",
    target: 1000,
  },
  {
    id: "vocab_2500",
    title: "Bậc Thầy HSK 5",
    description: "Ghi nhớ thuộc 2,500 từ vựng",
    icon: "sparkles",
    category: "vocab",
    target: 2500,
  },
  {
    id: "vocab_5000",
    title: "Đại Tông Sư Vạn Chữ",
    description: "Ghi nhớ thuộc 5,000 từ vựng cao cấp",
    icon: "star",
    category: "vocab",
    target: 5000,
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
    icon: "hardware-chip",
    category: "speed",
    target: 40,
  },
  {
    id: "speed_60",
    title: "Thần Tốc Vô Song",
    description: "Ghép đúng 60 cặp từ trong Game 60s",
    icon: "rocket",
    category: "speed",
    target: 60,
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
  {
    id: "ai_500",
    title: "Trí Tuệ Tối Thượng",
    description: "Tạo 500 từ vựng bằng AI",
    icon: "infinite",
    category: "ai",
    target: 500,
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
      let loadedFromFirestore = false;

      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const snap = await getDoc(userProgressRef(uid));
          if (snap.exists()) {
            const data = snap.data();
            xp = data.xp ?? 0;
            unlockedBadgeIds = data.unlockedBadgeIds || [];
            loadedFromFirestore = true;
          }
        } catch (fsErr) {
          console.warn("[userProgressSlice] Firestore read failed, falling back to local storage:", fsErr);
        }
      }

      if (!loadedFromFirestore) {
        const xpStr = await AsyncStorage.getItem(ASYNC_KEY_XP);
        const badgesJson = await AsyncStorage.getItem(ASYNC_KEY_BADGES);
        xp = xpStr ? parseInt(xpStr, 10) : 0;
        unlockedBadgeIds = badgesJson ? JSON.parse(badgesJson) : [];
      }

      set({ xp, unlockedBadgeIds });
      await AsyncStorage.setItem(ASYNC_KEY_XP, xp.toString());
      await AsyncStorage.setItem(ASYNC_KEY_BADGES, JSON.stringify(unlockedBadgeIds));
    } catch (err) {
      console.warn("[userProgressSlice] fetchUserProgress failed:", err);
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
