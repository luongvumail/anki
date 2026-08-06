import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../src/ui/store/useAppStore";
import { CardEntity } from "../../src/domain/card/cardEntity";
import { Colors, Typography, Spacing, Radii } from "../../constants/theme";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";

import { getLocalDateString } from "../../src/infrastructure/persistence/reviewTrackerRepo";
import { computeDueCount, computeLearnedCount, computeNewCount } from "../../src/domain/card/cardUtils";
import { BadgesGallery } from "../../components/stats/BadgesGallery";
import { getLevelInfo } from "../../src/domain/user/userProgress";

interface DayActivity {
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

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const decks = useAppStore((s) => s.decks);
  const cards = useAppStore((s) => s.cards);
  const fetchDecks = useAppStore((s) => s.fetchDecks);
  const fetchCards = useAppStore((s) => s.fetchCards);
  const loadReviewHistory = useAppStore((s) => s.loadReviewHistory);
  const reviewHistory = useAppStore((s) => s.reviewHistory);
  const streakCount = useAppStore((s) => s.streakCount);
  const [loadingCards, setLoadingCards] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadAllData = useCallback(async () => {
    setLoadingCards(true);
    if (decks.length === 0) {
      await fetchDecks();
    }

    const currentDecks = useAppStore.getState().decks;
    if (currentDecks.length > 0) {
      await Promise.all(currentDecks.map((d) => fetchCards(d.id)));
    }

    await loadReviewHistory();
    setLoadingCards(false);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [decks.length, fetchDecks, fetchCards, loadReviewHistory, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const allCardsList = useMemo(() => {
    let list: CardEntity[] = [];
    Object.values(cards).forEach((deckCards) => {
      list = list.concat(deckCards);
    });
    return list;
  }, [cards]);

  const totalCardsCount = allCardsList.length;

  const dueCount = useMemo(() => {
    return computeDueCount(allCardsList as any);
  }, [allCardsList]);

  const learnedCount = useMemo(() => {
    return computeLearnedCount(allCardsList as any);
  }, [allCardsList]);

  const newCardsCount = useMemo(() => {
    return computeNewCount(allCardsList as any);
  }, [allCardsList]);

  const retentionRatePct = useMemo(() => {
    if (totalCardsCount === 0) return 0;
    return Math.round((learnedCount / totalCardsCount) * 100);
  }, [totalCardsCount, learnedCount]);

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

  const xp = useAppStore((s) => s.xp || 0);
  const levelInfo = useMemo(() => getLevelInfo(xp), [xp]);

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
          <ActivityIndicator
            size="small"
            color={Colors.duolingo.green}
            style={{ marginVertical: 40 }}
          />
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
                <Ionicons name="time" size={24} color="#FF9600" />
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
            <SectionTitle>HƯỚNG DẪN SỬ DỤNG & QUY TRÌNH HỌC</SectionTitle>

            <View style={styles.guideListContainer}>
              {/* Step 1: SRS SM-2 Algorithm */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                    <Ionicons name="analytics" size={22} color={Colors.duolingo.purple} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>1. Thuật toán Trí nhớ Ngắt quãng (SRS SM-2)</Text>
                    <Text style={styles.guideSub}>Tự động tính thời điểm tối ưu nhắc ôn bài</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Bộ não con người sẽ quên tới 70% từ mới sau 24h. Thuật toán SRS SM-2 tự động tính toán thời gian phản xạ (ms) và số lần ôn tập để xếp lịch nhắc bài trước khi từ vựng bị quên, đưa từ vựng vào trí nhớ dài hạn vĩnh viễn.
                </Text>
              </DuolingoCard>

              {/* Step 2: 3-Stage Study Loop */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(28, 176, 246, 0.15)" }]}>
                    <Ionicons name="git-network" size={22} color={Colors.duolingo.blue} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>2. Lộ trình Học 3 Giai đoạn Thông minh</Text>
                    <Text style={styles.guideSub}>Nạp từ ➔ Kiểm tra Quiz ➔ Sửa lỗi Cắm cờ</Text>
                  </View>
                </View>
                <View style={styles.gestureGuideList}>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.blue }}>Giai đoạn 1 (Nạp từ):</Text> Lật thẻ Flashcard xem Hán tự, Pinyin, Phát âm, Dịch nghĩa & Bộ thủ.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>Giai đoạn 2 (Kiểm tra):</Text> Làm bài Quiz kiểm tra kiến thức đa dạng dạng bài.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>Giai đoạn 3 (Cắm cờ):</Text> Tự động lập vòng lặp sửa lỗi nhanh cho các câu làm sai hoặc làm chậm (&gt;4 giây).
                    </Text>
                  </View>
                </View>
              </DuolingoCard>

              {/* Step 3: Adaptive Quiz Types */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(88, 204, 2, 0.15)" }]}>
                    <Ionicons name="help-circle" size={22} color={Colors.duolingo.green} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>3. Chế độ Trắc nghiệm Thích ứng (Quiz)</Text>
                    <Text style={styles.guideSub}>4 Dạng bài tập biến hóa theo độ thuộc từ</Text>
                  </View>
                </View>
                <View style={styles.gestureGuideList}>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>Chọn Nghĩa Tiếng Việt:</Text> Nhớ ý nghĩa cơ bản của từ vựng mới.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.blue }}>Chọn Pinyin:</Text> Chuẩn hóa phiên âm &amp; dấu thanh điệu.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>Nghe âm thanh chọn Hán tự:</Text> Rèn phản xạ thính giác.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>Điền câu Cloze ngữ cảnh:</Text> Ứng dụng từ vựng trong câu hoàn chỉnh.
                    </Text>
                  </View>
                </View>
              </DuolingoCard>

              {/* Step 4: Arcade Practice Hub */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 200, 0, 0.15)" }]}>
                    <Ionicons name="game-controller" size={22} color={Colors.duolingo.yellow} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>4. Trung tâm Luyện tập Arcade</Text>
                    <Text style={styles.guideSub}>Luyện phản xạ với 3 Mini-Games tự do</Text>
                  </View>
                </View>
                <View style={styles.gestureGuideList}>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>Ghép Từ Nhanh 60s:</Text> Thử thách ghép cặp Hán tự ↔ Nghĩa siêu tốc.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>Xếp Từ Thành Câu:</Text> Ghép câu ví dụ có kèm từ gây nhiễu rèn ngữ pháp.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>Phòng Luyện Phát Âm AI:</Text> Thu âm đọc Hán tự, AI chấm điểm Pinyin &amp; 4 thanh điệu.
                    </Text>
                  </View>
                </View>
              </DuolingoCard>

              {/* Step 5: AI Automatic Creation */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(28, 176, 246, 0.15)" }]}>
                    <Ionicons name="sparkles" size={22} color={Colors.duolingo.blue} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>5. Nạp Từ Vựng Tự Động Bằng AI</Text>
                    <Text style={styles.guideSub}>Trích xuất dữ liệu từ vựng thông minh</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Nhập từ Hán hoặc câu văn Tiếng Trung ➔ AI tự động trích xuất Pinyin, Nghĩa Tiếng Việt, Phân tích Bộ thủ siêu ngắn gọn và tạo Câu ví dụ chuẩn ngữ cảnh trong 1 giây.
                </Text>
              </DuolingoCard>

              {/* Step 6: Rank Titles & Badges */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 150, 0, 0.15)" }]}>
                    <Ionicons name="trophy" size={22} color="#FF9600" />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>6. Cấp Độ Hán Ngữ &amp; Bộ Huy Hiệu</Text>
                    <Text style={styles.guideSub}>Thăng hạng danh hiệu thực chất &amp; mở khóa huy hiệu</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Tích lũy XP qua bài học để thăng hạng qua 6 cấp danh hiệu Hán ngữ chuẩn (từ <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>初学者</Text> tới <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>汉字宗师</Text>) và chinh phục Bộ 14 Huy hiệu thành tích cá nhân.
                </Text>
              </DuolingoCard>
            </View>
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
  trophyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.duolingo.blueDim,
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
  statCardIcon: { fontSize: 20 },
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

  guideListContainer: { gap: 12, marginBottom: Spacing.md },
  guideCard: { padding: Spacing.md },
  guideHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  guideIconTile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  guideHeaderText: { flex: 1 },
  guideTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  guideSub: { fontSize: 12, fontWeight: "600", color: Colors.duolingo.textMuted, marginTop: 2 },
  guideDesc: { fontSize: 13, color: Colors.duolingo.textMuted, lineHeight: 18, fontWeight: "500" },
  gestureGuideList: { gap: 8, marginTop: 4 },
  gestureRowItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  gestureText: { fontSize: 13, color: Colors.duolingo.textMuted, flex: 1 },
});   
