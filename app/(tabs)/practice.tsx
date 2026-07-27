import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useStore, Card } from "../../store/useStore";
import { getLevelInfo } from "../../store/slices/userProgressSlice";
import { getStreakCount } from "../../lib/reviewTracker";
import { Colors, Typography, Spacing, Radii } from "../../constants/theme";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { SpeedMatchModal } from "../../components/practice/SpeedMatchModal";
import { SentenceBuilderModal } from "../../components/practice/SentenceBuilderModal";
import { PronunciationTrainerModal } from "../../components/practice/PronunciationTrainerModal";

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const xp = useStore((s) => s.xp);
  const fetchUserProgress = useStore((s) => s.fetchUserProgress);
  const cards = useStore((s) => s.cards);
  const decks = useStore((s) => s.decks);
  const fetchDecks = useStore((s) => s.fetchDecks);
  const fetchCards = useStore((s) => s.fetchCards);

  const [streakCount, setStreakCount] = useState(0);
  const [showSpeedMatch, setShowSpeedMatch] = useState(false);
  const [showSentenceBuilder, setShowSentenceBuilder] = useState(false);
  const [showPronunciationTrainer, setShowPronunciationTrainer] = useState(false);

  useEffect(() => {
    fetchUserProgress();
    getStreakCount().then(setStreakCount);
    if (decks.length === 0) {
      fetchDecks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserProgress, fetchDecks, decks.length]);

  useEffect(() => {
    if (decks.length > 0) {
      decks.forEach((d) => {
        if (!cards[d.id]) fetchCards(d.id);
      });
    }
  }, [decks, cards, fetchCards]);

  const allCardsList = useMemo(() => {
    let list: Card[] = [];
    Object.values(cards).forEach((deckCards) => {
      list = list.concat(deckCards);
    });
    return list;
  }, [cards]);

  const levelInfo = useMemo(() => getLevelInfo(xp), [xp]);

  const handleOpenSpeedMatch = () => {
    if (allCardsList.length < 2) {
      Alert.alert(
        "Chưa đủ từ vựng",
        "Bạn cần thêm ít nhất 2 từ vựng vào bộ thẻ để chơi Game Ghép Từ."
      );
      return;
    }
    setShowSpeedMatch(true);
  };

  const handleOpenSentenceBuilder = () => {
    const validCards = allCardsList.filter(
      (c) => c.examples && c.examples.length > 0 && c.examples[0].chinese
    );

    if (validCards.length === 0) {
      Alert.alert(
        "Chưa có câu ví dụ",
        "Bạn cần nạp các từ vựng có câu ví dụ (bằng AI) để bắt đầu bài tập Xếp Từ Thành Câu."
      );
      return;
    }
    setShowSentenceBuilder(true);
  };

  const handleOpenPronunciationTrainer = () => {
    if (allCardsList.length === 0) {
      Alert.alert(
        "Chưa có từ vựng",
        "Bạn cần nạp từ vựng vào bộ thẻ trước khi luyện phát âm."
      );
      return;
    }
    setShowPronunciationTrainer(true);
  };

  return (
    <View style={styles.container}>
      <DuolingoHeader courseName="TRUNG TÂM LUYỆN TẬP" streakCount={streakCount} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Level & XP Banner */}
        <DuolingoCard style={styles.levelCard}>
          <View style={styles.levelHeaderRow}>
            <View style={styles.levelBadgeBox}>
              <Text style={styles.levelBadgeTitle}>{levelInfo.title}</Text>
              <Text style={styles.levelBadgeSub}>{levelInfo.titleVi}</Text>
            </View>

            <View style={styles.xpBox}>
              <Ionicons name="sparkles" size={18} color={Colors.duolingo.yellow} />
              <Text style={styles.xpValText}>{xp} XP</Text>
            </View>
          </View>

          <View style={styles.levelProgressRow}>
            <Text style={styles.levelNumText}>Level {levelInfo.level}</Text>
            <ProgressBar progress={levelInfo.progress} height={12} fillColor={Colors.duolingo.yellow} style={{ flex: 1 }} />
            <Text style={styles.nextLevelXPText}>{levelInfo.nextLevelXP} XP</Text>
          </View>
        </DuolingoCard>

        {/* Practice Arcade Modes List */}
        <SectionTitle>CHẾ ĐỘ LUYỆN TẬP TỰ DO</SectionTitle>

        {/* Mode 1: Speed Match */}
        <DuolingoCard style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={[styles.modeIconTile, { backgroundColor: "rgba(255, 200, 0, 0.15)" }]}>
              <Ionicons name="extension-puzzle" size={28} color={Colors.duolingo.yellow} />
            </View>
            <View style={styles.modeTextCol}>
              <Text style={styles.modeTitle}>🧩 GAME GHÉP TỪ NHANH 60S</Text>
              <Text style={styles.modeDesc}>
                Ghép ngẫu nhiên Chữ Hán & Nghĩa tương ứng trong 60 giây. Luyện phản xạ siêu tốc!
              </Text>
            </View>
          </View>
          <DuolingoButton
            title="CHƠI NGAY ➜"
            variant="yellow"
            size="lg"
            onPress={handleOpenSpeedMatch}
            style={{ marginTop: Spacing.md }}
          />
        </DuolingoCard>

        {/* Mode 2: Sentence Builder */}
        <DuolingoCard style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={[styles.modeIconTile, { backgroundColor: "rgba(28, 176, 246, 0.15)" }]}>
              <Ionicons name="create" size={28} color={Colors.duolingo.blue} />
            </View>
            <View style={styles.modeTextCol}>
              <Text style={styles.modeTitle}>🔤 XẾP TỪ THÀNH CÂU</Text>
              <Text style={styles.modeDesc}>
                Sắp xếp các từ bị xáo trộn thành câu Tiếng Trung hoàn chỉnh theo câu ví dụ AI.
              </Text>
            </View>
          </View>
          <DuolingoButton
            title="BẮT ĐẦU ➜"
            variant="primary"
            size="lg"
            onPress={handleOpenSentenceBuilder}
            style={{ marginTop: Spacing.md }}
          />
        </DuolingoCard>

        {/* Mode 3: AI Pronunciation Trainer */}
        <DuolingoCard style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={[styles.modeIconTile, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
              <Ionicons name="mic" size={28} color={Colors.duolingo.purple} />
            </View>
            <View style={styles.modeTextCol}>
              <Text style={styles.modeTitle}>🗣️ PHÒNG LUYỆN PHÁT ÂM AI</Text>
              <Text style={styles.modeDesc}>
                Thu âm giọng đọc Tiếng Trung, AI phân tích nhận diện Pinyin & 4 thanh điệu chuẩn xác.
              </Text>
            </View>
          </View>
          <DuolingoButton
            title="THU ÂM NGAY ➜"
            variant="purple"
            size="lg"
            onPress={handleOpenPronunciationTrainer}
            style={{ marginTop: Spacing.md }}
          />
        </DuolingoCard>
      </ScrollView>

      {/* Speed Match Modal */}
      {showSpeedMatch && (
        <SpeedMatchModal
          visible={showSpeedMatch}
          onClose={() => setShowSpeedMatch(false)}
          cards={allCardsList}
        />
      )}

      {/* Sentence Builder Modal */}
      {showSentenceBuilder && (
        <SentenceBuilderModal
          visible={showSentenceBuilder}
          onClose={() => setShowSentenceBuilder(false)}
          cards={allCardsList}
        />
      )}

      {/* AI Pronunciation Trainer Modal */}
      {showPronunciationTrainer && (
        <PronunciationTrainerModal
          visible={showPronunciationTrainer}
          onClose={() => setShowPronunciationTrainer(false)}
          cards={allCardsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.duolingo.bg },
  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },

  levelCard: { marginBottom: Spacing.lg, padding: Spacing.md },
  levelHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  levelBadgeBox: { backgroundColor: "#131F24", paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.md },
  levelBadgeTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  levelBadgeSub: { fontSize: 11, color: Colors.duolingo.textMuted, marginTop: 1, fontWeight: "600" },
  xpBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255, 200, 0, 0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full },
  xpValText: { fontSize: 14, fontWeight: "800", color: Colors.duolingo.yellow },

  levelProgressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelNumText: { fontSize: 12, fontWeight: "800", color: Colors.duolingo.textMuted },
  nextLevelXPText: { fontSize: 12, fontWeight: "800", color: Colors.duolingo.yellow },

  modeCard: { marginBottom: Spacing.md, padding: Spacing.md },
  modeRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  modeIconTile: { width: 52, height: 52, borderRadius: Radii.lg, alignItems: "center", justifyContent: "center" },
  modeTextCol: { flex: 1 },
  modeTitle: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  modeDesc: { fontSize: 12, color: Colors.duolingo.textMuted, marginTop: 3, lineHeight: 16 },
});
