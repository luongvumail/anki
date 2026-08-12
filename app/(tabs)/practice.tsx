import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore, Card } from "../../store/useStore";
import { getStreakCount } from "../../lib/reviewTracker";
import { Spacing, Radii, Typography, Layout } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { SpeedMatchModal } from "../../components/practice/SpeedMatchModal";
import { SentenceBuilderModal } from "../../components/practice/SentenceBuilderModal";
import { PronunciationTrainerModal } from "../../components/practice/PronunciationTrainerModal";

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const fetchUserProgress = useStore((s) => s.fetchUserProgress);
  const cards = useStore((s) => s.cards);
  const decks = useStore((s) => s.decks);
  const fetchDecks = useStore((s) => s.fetchDecks);
  const fetchCards = useStore((s) => s.fetchCards);

  const [streakCount, setStreakCount] = useState(0);
  const [showSpeedMatch, setShowSpeedMatch] = useState(false);
  const [showSentenceBuilder, setShowSentenceBuilder] = useState(false);
  const [showPronunciationTrainer, setShowPronunciationTrainer] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUserProgress();
      getStreakCount().then(setStreakCount);
    }, [fetchUserProgress])
  );

  useEffect(() => {
    if (decks.length === 0) {
      fetchDecks();
    }
  }, [fetchDecks, decks.length]);

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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <DuolingoHeader streakCount={streakCount} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Practice Arcade Modes List */}
        <SectionTitle style={{ marginTop: Spacing.xs }}>CHẾ ĐỘ LUYỆN TẬP TỰ DO</SectionTitle>


        {/* Mode 1: Speed Match */}
        <DuolingoCard style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={[styles.modeIconTile, { backgroundColor: theme.yellowDim }]}>
              <Ionicons name="stopwatch" size={Layout.iconXl} color={theme.yellow} />
            </View>
            <View style={styles.modeTextCol}>
              <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>GAME GHÉP TỪ NHANH 60S</Text>
              <Text style={[styles.modeDesc, { color: theme.textMuted }]}>
                Ghép ngẫu nhiên Chữ Hán & Nghĩa tương ứng trong 60 giây. Luyện phản xạ siêu tốc!
              </Text>
            </View>
          </View>
          <DuolingoButton
            title="CHƠI NGAY"
            icon={<Ionicons name="play" size={Layout.iconMd} color="#FFFFFF" />}
            variant="yellow"
            size="lg"
            onPress={handleOpenSpeedMatch}
            style={{ marginTop: Spacing.md }}
          />
        </DuolingoCard>

        {/* Mode 2: Sentence Builder */}
        <DuolingoCard style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={[styles.modeIconTile, { backgroundColor: theme.blueDim }]}>
              <Ionicons name="build" size={Layout.iconXl} color={theme.blue} />
            </View>
            <View style={styles.modeTextCol}>
              <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>XẾP TỪ THÀNH CÂU</Text>
              <Text style={[styles.modeDesc, { color: theme.textMuted }]}>
                Sắp xếp các từ bị xáo trộn thành câu Tiếng Trung hoàn chỉnh theo câu ví dụ AI.
              </Text>
            </View>
          </View>
          <DuolingoButton
            title="BẮT ĐẦU"
            icon={<Ionicons name="play" size={Layout.iconMd} color="#FFFFFF" />}
            variant="blue"
            size="lg"
            onPress={handleOpenSentenceBuilder}
            style={{ marginTop: Spacing.md }}
          />
        </DuolingoCard>

        {/* Mode 3: AI Pronunciation Trainer */}
        <DuolingoCard style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={[styles.modeIconTile, { backgroundColor: theme.greenDim }]}>
              <Ionicons name="mic" size={Layout.iconXl} color={theme.green} />
            </View>
            <View style={styles.modeTextCol}>
              <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>PHÒNG LUYỆN PHÁT ÂM AI</Text>
              <Text style={[styles.modeDesc, { color: theme.textMuted }]}>
                Thu âm giọng đọc Tiếng Trung, AI phân tích nhận diện Pinyin & 4 thanh điệu chuẩn xác.
              </Text>
            </View>
          </View>
          <DuolingoButton
            title="THU ÂM NGAY"
            icon={<Ionicons name="mic-circle" size={Layout.iconMd} color="#FFFFFF" />}
            variant="success"
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
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },
  modeCard: { marginBottom: Spacing.md, padding: Spacing.md },
  modeRow: { flexDirection: "row", gap: Spacing.md, alignItems: "center" },
  modeIconTile: { width: Layout.btnHeightXl, height: Layout.btnHeightXl, borderRadius: Radii.lg, alignItems: "center", justifyContent: "center" },
  modeTextCol: { flex: 1 },
  modeTitle: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold },
  modeDesc: { fontSize: Typography.caption.fontSize, marginTop: Spacing.xs, lineHeight: 17 },
});
