import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DeckPicker } from "../components/DeckPicker.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { SentenceBuilderGame } from "../components/SentenceBuilderGame.js";
import { SpeedMatchGame } from "../components/SpeedMatchGame.js";
import { theme } from "../theme/theme.js";
import { appStore } from "../store/useAppStore.js";

export const PracticeScreen: React.FC = () => {
  const [activeGame, setActiveGame] = useState<"NONE" | "SPEED_MATCH" | "SENTENCE_BUILDER">("NONE");
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [decks, setDecks] = useState(appStore.getState().decks);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || "deck_hsk1");

  useEffect(() => {
    appStore.loadDecks();
    const unsub = appStore.subscribe(() => {
      const d = appStore.getState().decks;
      setDecks(d);
      if (d.length > 0 && !selectedDeckId) {
        setSelectedDeckId(d[0].id);
      }
    });
    return unsub;
  }, []);

  if (activeGame === "SPEED_MATCH") {
    return (
      <SpeedMatchGame
        deckId={selectedDeckId}
        onFinish={(score) => {
          setLastScore(score);
          setActiveGame("NONE");
        }}
      />
    );
  }

  if (activeGame === "SENTENCE_BUILDER") {
    return (
      <SentenceBuilderGame
        onFinish={(score) => {
          setLastScore(score);
          setActiveGame("NONE");
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleRow}>
          <Icon name="gamepad" size={32} color={theme.colors.primary} />
          <Text style={styles.pageTitle}>Trung Tâm Luyện Tập Arcade</Text>
        </View>
        <Text style={styles.subtitle}>
          Rèn luyện phản xạ ghi nhớ từ vựng với các mini-games tương tác.
        </Text>

        <View style={styles.pickerSection}>
          <DeckPicker
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelectDeck={setSelectedDeckId}
          />
        </View>

        {lastScore !== null && (
          <DuolingoCard accessibilityLabel="Kết quả vừa chơi">
            <View style={styles.scoreRow}>
              <Icon name="celebrate" color={theme.colors.primary} />
              <Text style={styles.scoreText}>Kết quả trận gần nhất: {lastScore} Điểm!</Text>
            </View>
          </DuolingoCard>
        )}

        {/* Mini Game 1: Speed Match */}
        <DuolingoCard accessibilityLabel="Game Ghép Từ Nhanh 60s">
          <View style={styles.gameRow}>
            <View style={styles.gameInfo}>
              <Icon name="zap" size={32} color={theme.colors.secondary} />
              <Text style={styles.gameTitle}>Ghép Từ Nhanh 60s</Text>
              <Text style={styles.gameDesc}>
                Nối chữ Hán với nghĩa đúng trước khi hết giờ!
              </Text>
            </View>
            <DuolingoButton
              title="CHƠI NGAY"
              variant="secondary"
              onPress={() => setActiveGame("SPEED_MATCH")}
              accessibilityLabel="Bắt đầu chơi game Ghép từ nhanh 60s"
            />
          </View>
        </DuolingoCard>

        {/* Mini Game 2: Sentence Builder */}
        <DuolingoCard accessibilityLabel="Game Xếp Từ Thành Câu">
          <View style={styles.gameRow}>
            <View style={styles.gameInfo}>
              <Icon name="puzzle" size={32} color={theme.colors.info} />
              <Text style={styles.gameTitle}>Xếp Từ Thành Câu</Text>
              <Text style={styles.gameDesc}>
                Sắp xếp các thẻ từ vựng thành câu tiếng Trung hoàn chỉnh.
              </Text>
            </View>
            <DuolingoButton
              title="BẮT ĐẦU"
              variant="info"
              onPress={() => setActiveGame("SENTENCE_BUILDER")}
              accessibilityLabel="Bắt đầu chơi game Xếp từ thành câu"
            />
          </View>
        </DuolingoCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  pageTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  pickerSection: {
    marginBottom: theme.spacing.lg,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  scoreText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  gameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gameInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  gameTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs / 2,
  },
  gameDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
