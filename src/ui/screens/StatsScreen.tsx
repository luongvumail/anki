import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  computeDueCount,
  computeLearnedCount,
  computeNewCount,
} from "../../domain/card/cardUtils.js";
import { getLevelInfo } from "../../domain/user/userProgress.js";
import {
  DailyReviewLog,
  reviewTrackerRepo,
} from "../../infrastructure/persistence/reviewTrackerRepo.js";
import { BadgesGallery } from "../components/BadgesGallery.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { ActivityChart } from "../components/stats/ActivityChart.js";
import { LevelBannerCard } from "../components/stats/LevelBannerCard.js";
import { RetentionCard } from "../components/stats/RetentionCard.js";
import { appStore } from "../store/useAppStore.js";
import { useTheme } from "../theme/ThemeContext.js";

export const StatsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<DailyReviewLog[]>([]);
  const [storeState, setStoreState] = useState(appStore.getState());

  useEffect(() => {
    reviewTrackerRepo.getRecentLogs(7).then(setLogs);
    const unsubStore = appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
    return () => {
      unsubStore();
    };
  }, []);

  const { userProgress, cards } = storeState;

  const allCardsList = useMemo(() => {
    let list: any[] = [];
    Object.values(cards).forEach((deckCards) => {
      list = list.concat(deckCards);
    });
    return list;
  }, [cards]);

  const totalCardsCount = allCardsList.length;
  const dueCount = useMemo(() => computeDueCount(allCardsList), [allCardsList]);
  const learnedCount = useMemo(() => computeLearnedCount(allCardsList), [allCardsList]);
  const newCardsCount = useMemo(() => computeNewCount(allCardsList), [allCardsList]);

  const retentionRatePct = useMemo(() => {
    if (totalCardsCount === 0) return 0;
    return Math.round((learnedCount / totalCardsCount) * 100);
  }, [totalCardsCount, learnedCount]);

  const levelInfo = useMemo(() => getLevelInfo(userProgress.totalXp), [userProgress.totalXp]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.headerTitleRow}>
          <Icon name="stats" size={30} color={theme.colors.primary} />
          <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
            Thống Kê Tiến Độ Học
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Theo dõi khả năng ghi nhớ FSRS v5 và hành trình tích lũy từ vựng của bạn.
        </Text>

        {/* Level Banner */}
        <View style={styles.sectionMargin}>
          <LevelBannerCard levelInfo={levelInfo} totalXp={userProgress.totalXp} />
        </View>

        {/* Retention Forecast Card */}
        <View style={styles.sectionMargin}>
          <RetentionCard retentionRatePct={retentionRatePct} />
        </View>

        {/* 2x2 Stats Grid */}
        <View style={styles.grid2}>
          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Chuỗi học liên tục">
              <Icon name="flame" size={24} color={theme.colors.secondary} />
              <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                {userProgress.streakDays} Ngày
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Chuỗi Học Liên Tục
              </Text>
            </DuolingoCard>
          </View>

          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Số từ đã ghi nhớ">
              <Icon name="check" size={24} color={theme.colors.primary} />
              <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                {learnedCount} từ
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Đã Ghi Nhớ Thuộc
              </Text>
            </DuolingoCard>
          </View>

          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Số từ cần ôn tập">
              <Icon name="clock" size={24} color={theme.colors.secondary} />
              <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                {dueCount} từ
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Cần Ôn Tập Ngay
              </Text>
            </DuolingoCard>
          </View>

          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Số từ mới chưa học">
              <Icon name="sparkles" size={24} color={theme.colors.info} />
              <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                {newCardsCount} từ
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Từ Mới Chưa Học
              </Text>
            </DuolingoCard>
          </View>
        </View>

        {/* Activity Chart */}
        <View style={styles.sectionMargin}>
          <ActivityChart logs={logs} />
        </View>

        {/* Badges Gallery */}
        <View style={styles.sectionMargin}>
          <BadgesGallery streakCount={userProgress.streakDays} learnedCards={learnedCount} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  sectionMargin: {
    marginTop: 12,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  gridCard: {
    width: "48%",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
