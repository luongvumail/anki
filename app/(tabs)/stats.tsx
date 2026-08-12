import React, { useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radii } from "../../constants/theme";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { BadgesGallery } from "../../components/stats/BadgesGallery";
import { StudyGuideSection } from "../../components/stats/StudyGuideSection";
import { SkeletonCard } from "../../components/ui/SkeletonCard";
import { useStats } from "../../hooks/useStats";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
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
    }, [loadAllData])
  );

  return (
    <View style={styles.container}>
      <DuolingoHeader streakCount={streakCount} />

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
            <DuolingoCard style={styles.levelBanner}>
              <View style={styles.levelRow}>
                <View style={styles.levelBadgeCircle}>
                  <Text style={styles.levelBadgeText}>Lv.{levelInfo.level}</Text>
                </View>
                <View style={styles.levelTextContainer}>
                  <View style={styles.levelTitleRow}>
                    <Text style={styles.levelTitleCn}>{levelInfo.title}</Text>
                    <Text style={styles.levelTitleVi}>({levelInfo.titleVi})</Text>
                  </View>
                  <Text style={styles.xpText}>{xp} XP Tích Lũy</Text>
                </View>
              </View>
              <ProgressBar
                progress={levelInfo.progress}
                height={12}
                fillColor={Colors.duolingo.yellow}
                style={{ marginTop: Spacing.sm }}
              />
            </DuolingoCard>

            {/* Main Trophy Progress Card */}
            <DuolingoCard style={styles.trophyBanner}>
              <View style={styles.trophyRow}>
                <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 200, 0, 0.15)", marginRight: 10 }]}>
                  <Ionicons name="trophy" size={24} color={Colors.duolingo.yellow} />
                </View>
                <View style={styles.trophyText}>
                  <Text style={styles.trophyTitle}>TIẾN ĐỘ THUỘC TỪ VỰNG</Text>
                  <Text style={styles.trophySub}>
                    {retentionRatePct === 100
                      ? "Xuất sắc! Bạn đã thuộc 100% vốn từ hiện tại"
                      : `Bạn đã ghi nhớ thuộc ${retentionRatePct}% tổng từ vựng`}
                  </Text>
                </View>
                <View style={styles.retentionBadge}>
                  <Text style={styles.retentionBadgeText}>{retentionRatePct}%</Text>
                </View>
              </View>

              <ProgressBar
                progress={retentionRatePct / 100}
                height={10}
                fillColor={Colors.duolingo.green}
                style={{ marginTop: Spacing.sm }}
              />
            </DuolingoCard>

            {/* Overview Stat Cards Grid */}
            <View style={styles.statsGrid}>
              <DuolingoCard style={styles.statCardItem}>
                <Ionicons name="flame" size={24} color={Colors.duolingo.yellow} />
                <Text style={styles.statCardVal}>{streakCount} Ngày</Text>
                <Text style={styles.statCardLabel}>Chuỗi Học Liên Tục</Text>
              </DuolingoCard>

              <DuolingoCard style={styles.statCardItem}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.duolingo.green} />
                <Text style={styles.statCardVal}>{learnedCount} từ</Text>
                <Text style={styles.statCardLabel}>Đã Ghi Nhớ Thuộc</Text>
              </DuolingoCard>

              <DuolingoCard style={styles.statCardItem}>
                <Ionicons name="time" size={24} color={Colors.duolingo.orange} />
                <Text style={styles.statCardVal}>{dueCount} từ</Text>
                <Text style={styles.statCardLabel}>Cần Ôn Tập Ngay</Text>
              </DuolingoCard>

              <DuolingoCard style={styles.statCardItem}>
                <Ionicons name="sparkles" size={24} color={Colors.duolingo.blue} />
                <Text style={styles.statCardVal}>{newCardsCount} từ</Text>
                <Text style={styles.statCardLabel}>Từ Mới Chưa Học</Text>
              </DuolingoCard>
            </View>

            {/* Weekly Activity Bar Chart */}
            <SectionTitle>HOẠT ĐỘNG 7 NGÀY GẦN ĐÂY</SectionTitle>

            <DuolingoCard style={styles.chartCard}>
              <View style={styles.chartRow}>
                {weeklyActivity.map((day) => {
                  const heightPct = Math.min(100, Math.max(12, (day.count / maxWeeklyCount) * 100));

                  return (
                    <View key={day.dateStr} style={styles.barColumn}>
                      <Text style={styles.barCountText}>{day.count > 0 ? day.count : ""}</Text>

                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPct}%`,
                              backgroundColor: day.isToday
                                ? Colors.duolingo.blue
                                : day.count > 0
                                  ? Colors.duolingo.green
                                  : Colors.duolingo.cardBottom,
                            },
                          ]}
                        />
                      </View>

                      <Text style={[styles.barDayText, day.isToday && styles.barDayToday]}>
                        {day.dayName}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </DuolingoCard>

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
  container: { flex: 1, backgroundColor: Colors.duolingo.bg },
  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },

  levelBanner: { padding: Spacing.md, marginBottom: Spacing.md },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  levelBadgeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.duolingo.yellowDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.duolingo.yellow,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.duolingo.yellow,
  },
  levelTextContainer: { flex: 1 },
  levelTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  levelTitleCn: { fontSize: 18, fontWeight: "800", color: Colors.text.white },
  levelTitleVi: { fontSize: 13, fontWeight: "600", color: Colors.duolingo.textMuted },
  xpText: { fontSize: 12, fontWeight: "800", color: Colors.duolingo.yellow, marginTop: 2 },

  trophyBanner: { padding: Spacing.md, marginBottom: Spacing.md },
  trophyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  retentionBadge: {
    backgroundColor: Colors.duolingo.greenDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  retentionBadgeText: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.duolingo.green,
  },
  guideIconTile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  trophyText: { flex: 1 },
  trophyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  trophySub: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.duolingo.textMuted,
    marginTop: 2,
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: Spacing.md },
  statCardItem: { width: "48%", padding: Spacing.md, alignItems: "flex-start" },
  statCardVal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
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
    fontSize: 10,
    color: Colors.duolingo.textMuted,
    fontWeight: "700",
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: Colors.duolingo.cardBottom,
    borderRadius: 7,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: { width: "100%", borderRadius: 7 },
  barDayText: { fontSize: 12, color: Colors.duolingo.textMuted, marginTop: 6, fontWeight: "600" },
  barDayToday: { color: "#FFFFFF", fontWeight: "800" },
});
