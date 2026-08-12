import { useState, useRef, useMemo, useCallback } from "react";
import { Animated } from "react-native";
import { useStore, Card } from "../store/useStore";
import { getReviewHistory, getStreakCount, getLocalDateString } from "../lib/reviewTracker";
import { computeLearnedCount, getDeckMasteryPct } from "../lib/deckUtils";
import { isDue } from "../lib/srs";
import { getLevelInfo } from "../store/slices/userProgressSlice";

export interface DayActivity {
  dateStr: string;
  dayName: string;
  count: number;
  isToday: boolean;
}

function getLast7Days(): DayActivity[] {
  const result: DayActivity[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayName = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
    result.push({
      dateStr,
      dayName,
      count: 0,
      isToday: i === 0,
    });
  }
  return result;
}

export function useStats() {
  const cards = useStore((s) => s.cards);
  const fetchDecks = useStore((s) => s.fetchDecks);
  const fetchCards = useStore((s) => s.fetchCards);
  const userId = useStore((s) => s.userId);
  const xp = useStore((s) => s.xp || 0);

  const [loadingCards, setLoadingCards] = useState(() => {
    return Object.keys(cards).length === 0;
  });
  const [reviewHistory, setReviewHistory] = useState<Record<string, number>>({});
  const [streakCount, setStreakCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(Object.keys(cards).length > 0 ? 1 : 0)).current;

  const loadAllData = useCallback(async () => {
    if (!userId) return;

    const currentStore = useStore.getState();
    let currentDecks = currentStore.decks;
    const hasCardsInStore = Object.keys(currentStore.cards).length > 0;

    if (!hasCardsInStore) {
      setLoadingCards(true);
      fadeAnim.setValue(0);
    }

    if (currentDecks.length === 0) {
      await fetchDecks();
      currentDecks = useStore.getState().decks;
    }

    if (currentDecks.length > 0) {
      await Promise.all(currentDecks.map((d) => fetchCards(d.id)));
    }

    const history = await getReviewHistory();
    const streak = await getStreakCount();
    setReviewHistory(history);
    setStreakCount(streak);

    setLoadingCards(false);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [userId, fetchDecks, fetchCards, fadeAnim]);

  const allCardsList = useMemo(() => {
    let list: Card[] = [];
    Object.values(cards).forEach((deckCards) => {
      list = list.concat(deckCards);
    });
    return list;
  }, [cards]);

  const totalCardsCount = allCardsList.length;

  const dueCount = useMemo(() => {
    return allCardsList.filter((c) => isDue(c.srs)).length;
  }, [allCardsList]);

  const learnedCount = useMemo(() => {
    return computeLearnedCount(allCardsList);
  }, [allCardsList]);

  const newCardsCount = useMemo(() => {
    return allCardsList.filter((c) => !c.srs || c.srs.repetitions === 0).length;
  }, [allCardsList]);

  const retentionRatePct = useMemo(() => {
    return getDeckMasteryPct(totalCardsCount, dueCount, allCardsList);
  }, [totalCardsCount, dueCount, allCardsList]);

  const weeklyActivity = useMemo(() => {
    const days = getLast7Days();
    days.forEach((day) => {
      day.count = reviewHistory[day.dateStr] || 0;
    });
    return days;
  }, [reviewHistory]);

  const maxWeeklyCount = useMemo(() => {
    const max = Math.max(...weeklyActivity.map((d) => d.count));
    return max > 0 ? max : 1;
  }, [weeklyActivity]);

  const levelInfo = useMemo(() => getLevelInfo(xp), [xp]);

  return {
    loadingCards,
    streakCount,
    fadeAnim,
    levelInfo,
    xp,
    retentionRatePct,
    learnedCount,
    dueCount,
    newCardsCount,
    weeklyActivity,
    maxWeeklyCount,
    loadAllData,
  };
}
