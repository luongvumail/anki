import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore, Card } from "../../store/useStore";
import { Colors, Typography, Spacing } from "../../constants/theme";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";

import { getReviewHistory, getStreakCount, getLocalDateString } from "../../lib/reviewTracker";
import { isDue } from "../../lib/srs";
import { BadgesGallery } from "../../components/stats/BadgesGallery";

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
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const fetchDecks = useStore((s) => s.fetchDecks);
  const fetchCards = useStore((s) => s.fetchCards);
  const userId = useStore((s) => s.userId);
  const [loadingCards, setLoadingCards] = useState(true);
  const [reviewHistory, setReviewHistory] = useState<Record<string, number>>({});
  const [streakCount, setStreakCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadAllData = useCallback(async () => {
    if (!userId) return;
    setLoadingCards(true);
    if (decks.length === 0) {
      await fetchDecks();
    }

    const currentDecks = useStore.getState().decks;
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
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [userId, decks.length, fetchDecks, fetchCards, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

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
    return allCardsList.filter((c) => c.srs && c.srs.repetitions > 0).length;
  }, [allCardsList]);

  const newCardsCount = useMemo(() => {
    return allCardsList.filter((c) => !c.srs || c.srs.repetitions === 0).length;
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

  return (
    <View style={styles.container}>
      <DuolingoHeader courseName="Anki" streakCount={streakCount} />

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
            {/* Main Trophy Progress Card */}
            <DuolingoCard style={styles.trophyBanner}>
              <View style={styles.trophyRow}>
                <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 200, 0, 0.15)", marginRight: 10 }]}>
                  <Ionicons name="trophy" size={24} color={Colors.duolingo.yellow} />
                </View>
                <View style={styles.trophyText}>
                  <Text style={styles.trophyTitle}>TIẾN ĐỘ THUỘC TỪ VỰNG</Text>
                  <Text style={styles.trophySub}>
                    Bạn đã ghi nhớ thuộc {retentionRatePct}% tổng từ vựng
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={retentionRatePct / 100}
                height={12}
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
            <SectionTitle>HƯỚNG DẪN SỬ DỤNG & NGUYÊN LÝ HOẠT ĐỘNG</SectionTitle>

            <View style={styles.guideListContainer}>
              {/* Step 1: SRS Mechanics */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
                    <Ionicons name="analytics" size={22} color={Colors.duolingo.purple} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>1. Nguyên lý Trí nhớ Ngắt quãng (SRS)</Text>
                    <Text style={styles.guideSub}>Thuật toán SuperMemo-2 (SM-2)</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Bộ não con người sẽ quên tới 70% từ mới sau 24 giờ. Thuật toán SRS tự động tính
                  toán chính xác thời điểm từ vựng sắp bị quên để nhắc bạn ôn tập. Mỗi lần trả lời
                  đúng, khoảng cách ngày ôn sẽ nhân lên (1 ngày ➔ 6 ngày ➔ 15 ngày ➔ 1 tháng...),
                  đưa từ vựng vào trí nhớ dài hạn vĩnh viễn.
                </Text>
              </DuolingoCard>

              {/* Step 2: Swipe Gestures */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(28, 176, 246, 0.15)" }]}>
                    <Ionicons name="card" size={22} color={Colors.duolingo.blue} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>2. Chế độ Lật Thẻ Flashcard</Text>
                    <Text style={styles.guideSub}>
                      Tự đánh giá mức độ thuộc từ bằng thao tác vuốt
                    </Text>
                  </View>
                </View>
                <View style={styles.gestureGuideList}>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>Chạm mặt thẻ:</Text> Mở
                      đáp án Pinyin, âm thanh phát âm, dịch nghĩa & câu ví dụ.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.red }}>
                        Vuốt Trái (Quên):
                      </Text>{" "}
                      Thẻ xuất hiện lại sau 2 thẻ nữa để ôn lại trong phiên.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>
                        Vuốt Lên (Khó):
                      </Text>{" "}
                      Ôn lại ở cuối phiên và lặp lại vào ngày mai (1 ngày).
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>
                        Vuốt Phải (Dễ):
                      </Text>{" "}
                      Thuộc từ hoàn toàn, hệ thống tự động tăng khoảng cách ôn tập tiếp theo.
                    </Text>
                  </View>
                </View>
              </DuolingoCard>

              {/* Step 3: Quiz Mode - Adaptive Questions */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(88, 204, 2, 0.15)" }]}>
                    <Ionicons name="help-circle" size={22} color={Colors.duolingo.green} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>3. Chế độ Trắc nghiệm Thích ứng (Quiz)</Text>
                    <Text style={styles.guideSub}>
                      Dạng bài tập tự động thay đổi theo độ thuộc từ
                    </Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Hệ thống tự động điều chỉnh dạng câu hỏi dựa trên số lần bạn đã ôn tập thẻ đó:
                </Text>
                <View style={styles.gestureGuideList}>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>Lần đầu (Từ mới):</Text>{" "}
                      Chọn nghĩa Tiếng Việt — Ưu tiên ghi nhớ ý nghĩa từ vựng trước.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>
                        Lần 2 - 3:
                      </Text>{" "}
                      Chọn Pinyin & Thanh điệu — Luyện chuẩn hóa phiên âm.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>
                        Lần 4 - 5:
                      </Text>{" "}
                      Nghe phát âm chọn Chữ Hán — Rèn luyện phản xạ nghe.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.green }}>
                        Từ thuộc sâu:
                      </Text>{" "}
                      Điền từ vào câu ngữ cảnh (Cloze) — Ứng dụng từ trong câu thực tế.
                    </Text>
                  </View>
                </View>
              </DuolingoCard>

              {/* Step 4: Practice Hub & Games */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 200, 0, 0.15)" }]}>
                    <Ionicons name="game-controller" size={22} color={Colors.duolingo.yellow} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>4. Trung tâm Luyện tập & Mini-Games</Text>
                    <Text style={styles.guideSub}>
                      Luyện phản xạ tự do không ảnh hưởng lịch SRS
                    </Text>
                  </View>
                </View>
                <View style={styles.gestureGuideList}>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>
                        Game Ghép Từ Nhanh 60s:
                      </Text>{" "}
                      Thử thách 60 giây ghép cặp Chữ Hán ↔ Nghĩa/Pinyin rèn phản xạ.
                    </Text>
                  </View>
                  <View style={styles.gestureRowItem}>
                    <Text style={styles.gestureText}>
                      <Text style={{ fontWeight: "800", color: Colors.duolingo.blue }}>
                        Xếp Từ Thành Câu:
                      </Text>{" "}
                      Kéo/bấm từ xáo trộn để sắp xếp lại thành câu ví dụ chuẩn ngữ pháp.
                    </Text>
                  </View>
                </View>
              </DuolingoCard>

              {/* Step 5: XP & Badges System */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 150, 0, 0.15)" }]}>
                    <Ionicons name="ribbon" size={22} color="#FF9600" />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>5. Điểm XP & Cấp độ Hán Ngữ</Text>
                    <Text style={styles.guideSub}>Tích lũy kinh nghiệm & mở khóa huy hiệu</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Mỗi lần học bài (+50 XP), trả lời đúng Quiz (+5 XP) hoặc chơi Game 60s (+15 XP)
                  đều tích lũy điểm kinh nghiệm để thăng cấp danh hiệu (từ{" "}
                  <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>初学者</Text>{" "}
                  tới{" "}
                  <Text style={{ fontWeight: "800", color: Colors.duolingo.purple }}>汉字宗师</Text>
                  ) và mở khóa Bộ Huy Hiệu cá nhân.
                </Text>
              </DuolingoCard>

              {/* Step 6: AI Card Generator */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(28, 176, 246, 0.15)" }]}>
                    <Ionicons name="sparkles" size={22} color={Colors.duolingo.blue} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>6. Nạp từ vựng tự động bằng AI</Text>
                    <Text style={styles.guideSub}>Tạo thẻ từ vựng siêu tốc với AI</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Bấm vào nút{" "}
                  <Text style={{ fontWeight: "800", color: Colors.duolingo.blue }}>AI (+)</Text> ➔
                  Nhập chữ Hán/câu Tiếng Trung ➔ AI tự động tạo Pinyin, nghĩa Tiếng Việt, phân tích
                  Bộ thủ & câu ví dụ. Tự động loại bỏ từ trùng lặp và lưu tất cả bằng 1 chạm.
                </Text>
              </DuolingoCard>

              {/* Step 7: Daily Learning Streak */}
              <DuolingoCard style={styles.guideCard}>
                <View style={styles.guideHeaderRow}>
                  <View style={[styles.guideIconTile, { backgroundColor: "rgba(255, 200, 0, 0.15)" }]}>
                    <Ionicons name="flame" size={22} color={Colors.duolingo.yellow} />
                  </View>
                  <View style={styles.guideHeaderText}>
                    <Text style={styles.guideTitle}>7. Duy trì Chuỗi Học (Streak)</Text>
                    <Text style={styles.guideSub}>Bí quyết ghi nhớ bền vững</Text>
                  </View>
                </View>
                <Text style={styles.guideDesc}>
                  Mỗi ngày chỉ cần ôn tập ít nhất 1 bài để giữ vững ngọn lửa{" "}
                  <Text style={{ fontWeight: "800", color: Colors.duolingo.yellow }}>
                    Streak
                  </Text>
                  . Việc học đều đặn 5-10 phút mỗi ngày hiệu quả hơn gấp nhiều lần so với học dồn
                  dập vào cuối tuần!
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

  trophyBanner: { padding: Spacing.md, marginBottom: Spacing.md },
  trophyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
    fontSize: 12,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  trophySub: {
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: Spacing.md },
  statCardItem: { width: "48%", padding: Spacing.md, alignItems: "flex-start" },
  statCardIcon: { fontSize: 20 },
  statCardVal: {
    fontSize: 20,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
    marginTop: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
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
  guideTitle: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  guideSub: { fontSize: 12, fontWeight: "600", color: Colors.duolingo.textMuted, marginTop: 2 },
  guideDesc: { fontSize: 13, color: Colors.duolingo.textMuted, lineHeight: 18, fontWeight: "500" },
  gestureGuideList: { gap: 8, marginTop: 4 },
  gestureRowItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  gestureText: { fontSize: 13, color: Colors.duolingo.textMuted, flex: 1 },
});
