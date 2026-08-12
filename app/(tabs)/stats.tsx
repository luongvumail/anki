import React, { useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Radii, Typography, Layout, BorderWidths } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { AppCard } from "../../components/ui/AppCard";
import { AppHeader } from "../../components/ui/AppHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { BadgesGallery } from "../../components/stats/BadgesGallery";
import { StudyGuideSection } from "../../components/stats/StudyGuideSection";
import { SkeletonCard } from "../../components/ui/SkeletonCard";
import { useStats } from "../../hooks/useStats";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const {
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
  } = useStats();

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AppHeader streakCount={streakCount} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loadingCards ? (
          <View style={{ marginTop: Spacing.md }}>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Level & Rank Hero Banner */}
            <AppCard style={styles.levelBanner}>
              <View style={styles.levelRow}>
                <View
                  style={[
                    styles.levelBadgeCircle,
                    { backgroundColor: theme.yellowDim, borderColor: theme.yellow },
                  ]}
                >
                  <Text style={[styles.levelBadgeText, { color: theme.yellow }]}>
                    Lv.{levelInfo.level}
                  </Text>
                </View>
                <View style={styles.levelTextContainer}>
                  <View style={styles.levelTitleRow}>
                    <Text style={[styles.levelTitleCn, { color: theme.textPrimary }]}>
                      {levelInfo.title}
                    </Text>
                    <Text style={[styles.levelTitleVi, { color: theme.textMuted }]}>
                      ({levelInfo.titleVi})
                    </Text>
                  </View>
                  <Text style={[styles.xpText, { color: theme.yellow }]}>{xp} XP Tích Lũy</Text>
                </View>
              </View>
              <ProgressBar
                progress={levelInfo.progress}
                height={Spacing.sm}
                fillColor={theme.yellow}
                style={{ marginTop: Spacing.sm }}
              />
            </AppCard>

            {/* Main Trophy Progress Card */}
            <AppCard style={styles.trophyBanner}>
              <View style={styles.trophyRow}>
                <View
                  style={[
                    styles.guideIconTile,
                    { backgroundColor: theme.yellowDim, marginRight: Spacing.cellPadding },
                  ]}
                >
                  <Ionicons name="trophy" size={Layout.iconLg} color={theme.yellow} />
                </View>
                <View style={styles.trophyText}>
                  <Text style={[styles.trophyTitle, { color: theme.textPrimary }]}>
                    TIẾN ĐỘ THUỘC TỪ VỰNG
                  </Text>
                  <Text style={[styles.trophySub, { color: theme.textMuted }]}>
                    {retentionRatePct === 100
                      ? "Xuất sắc! Bạn đã thuộc 100% vốn từ hiện tại"
                      : `Bạn đã ghi nhớ thuộc ${retentionRatePct}% tổng từ vựng`}
                  </Text>
                </View>
                <View style={[styles.retentionBadge, { backgroundColor: theme.greenDim }]}>
                  <Text style={[styles.retentionBadgeText, { color: theme.green }]}>
                    {retentionRatePct}%
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={retentionRatePct / 100}
                height={Spacing.sm}
                fillColor={theme.green}
                style={{ marginTop: Spacing.sm }}
              />
            </AppCard>

            {/* Overview Stat Cards Grid */}
            <View style={styles.statsGrid}>
              <AppCard style={styles.statCardItem}>
                <Ionicons name="flame" size={Layout.iconLg} color={theme.yellow} />
                <Text style={[styles.statCardVal, { color: theme.textPrimary }]}>
                  {streakCount} Ngày
                </Text>
                <Text style={[styles.statCardLabel, { color: theme.textMuted }]}>
                  Chuỗi Học Liên Tục
                </Text>
              </AppCard>

              <AppCard style={styles.statCardItem}>
                <Ionicons name="checkmark-circle" size={Layout.iconLg} color={theme.green} />
                <Text style={[styles.statCardVal, { color: theme.textPrimary }]}>
                  {learnedCount} từ
                </Text>
                <Text style={[styles.statCardLabel, { color: theme.textMuted }]}>
                  Đã Ghi Nhớ Thuộc
                </Text>
              </AppCard>

              <AppCard style={styles.statCardItem}>
                <Ionicons name="time" size={Layout.iconLg} color={theme.yellow} />
                <Text style={[styles.statCardVal, { color: theme.textPrimary }]}>
                  {dueCount} từ
                </Text>
                <Text style={[styles.statCardLabel, { color: theme.textMuted }]}>
                  Cần Ôn Tập Ngay
                </Text>
              </AppCard>

              <AppCard style={styles.statCardItem}>
                <Ionicons name="sparkles" size={Layout.iconLg} color={theme.blue} />
                <Text style={[styles.statCardVal, { color: theme.textPrimary }]}>
                  {newCardsCount} từ
                </Text>
                <Text style={[styles.statCardLabel, { color: theme.textMuted }]}>
                  Từ Mới Chưa Học
                </Text>
              </AppCard>
            </View>

            {/* Weekly Activity Bar Chart */}
            <SectionTitle>HOẠT ĐỘNG 7 NGÀY GẦN ĐÂY</SectionTitle>

            <AppCard style={styles.chartCard}>
              <View style={styles.chartRow}>
                {weeklyActivity.map((day) => {
                  const heightPct = Math.min(100, Math.max(12, (day.count / maxWeeklyCount) * 100));

                  return (
                    <View key={day.dateStr} style={styles.barColumn}>
                      <Text style={[styles.barCountText, { color: theme.textMuted }]}>
                        {day.count > 0 ? day.count : ""}
                      </Text>

                      <View style={[styles.barTrack, { backgroundColor: theme.cardBottom }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPct}%`,
                              backgroundColor: day.isToday
                                ? theme.blue
                                : day.count > 0
                                  ? theme.green
                                  : theme.cardBottom,
                            },
                          ]}
                        />
                      </View>

                      <Text
                        style={[
                          styles.barDayText,
                          { color: day.isToday ? theme.textPrimary : theme.textMuted },
                          day.isToday && styles.barDayToday,
                        ]}
                      >
                        {day.dayName}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </AppCard>

            {/* Achievements Badges Gallery Section */}
            <BadgesGallery streakCount={streakCount} learnedCards={learnedCount} />

            {/* Comprehensive User Guide & SRS Mechanics Section */}
            <StudyGuideSection />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },

  levelBanner: { padding: Spacing.md, marginBottom: Spacing.md },
  levelRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  levelBadgeCircle: {
    width: Layout.btnHeightLg,
    height: Layout.btnHeightLg,
    borderRadius: Layout.btnHeightLg / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: BorderWidths.default,
  },
  levelBadgeText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  levelTextContainer: { flex: 1 },
  levelTitleRow: { flexDirection: "row", alignItems: "baseline", gap: Spacing.xs },
  levelTitleCn: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold },
  levelTitleVi: { fontSize: Typography.caption.fontSize, fontWeight: Typography.weight.semibold },
  xpText: {
    fontSize: Typography.caption1.fontSize,
    fontWeight: Typography.weight.extraBold,
    marginTop: 2,
  },

  trophyBanner: { padding: Spacing.md, marginBottom: Spacing.md },
  trophyRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  retentionBadge: {
    paddingHorizontal: Spacing.cellPadding,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  retentionBadgeText: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  guideIconTile: {
    width: Layout.avatarMd,
    height: Layout.avatarMd,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  trophyText: { flex: 1 },
  trophyTitle: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.8,
  },
  trophySub: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.semibold,
    marginTop: 2,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.cellPadding,
    marginBottom: Spacing.md,
  },
  statCardItem: { width: "48%", padding: Spacing.md, alignItems: "flex-start" },
  statCardVal: {
    fontSize: Typography.titleMD.fontSize,
    fontWeight: Typography.weight.extraBold,
    marginTop: Spacing.xs,
  },
  statCardLabel: {
    fontSize: Typography.caption1.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
  },

  chartCard: { padding: Spacing.md, marginBottom: Spacing.md },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 130,
  },
  barColumn: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  barCountText: {
    fontSize: Typography.caption2.fontSize,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  barTrack: {
    width: Spacing.cellPadding,
    height: 90,
    borderRadius: Radii.full,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: { width: "100%", borderRadius: Radii.full },
  barDayText: {
    fontSize: Typography.caption1.fontSize,
    marginTop: Spacing.xs,
    fontWeight: Typography.weight.semibold,
  },
  barDayToday: { fontWeight: Typography.weight.extraBold },
});
