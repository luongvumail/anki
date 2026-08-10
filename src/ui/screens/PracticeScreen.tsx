import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AIAddCardModal } from "../components/AIAddCardModal.js";
import { DeckPicker } from "../components/DeckPicker.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { SentenceBuilderGame } from "../components/SentenceBuilderGame.js";
import { SpeedMatchGame } from "../components/SpeedMatchGame.js";
import { SpeakingGame } from "../components/SpeakingGame.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { appStore } from "../store/useAppStore.js";

export const PracticeScreen: React.FC = () => {
  const { theme } = useTheme();
  const [activeGame, setActiveGame] = useState<"NONE" | "SPEED_MATCH" | "SENTENCE_BUILDER" | "SPEAKING">("NONE");
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [decks, setDecks] = useState(appStore.getState().decks);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(appStore.getState().decks[0]?.id || "");
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  useEffect(() => {
    appStore.loadDecks();
    const unsub = appStore.subscribe(() => {
      const d = appStore.getState().decks;
      setDecks(d);
      setSelectedDeckId((prev) => {
        if (prev && d.some((deck) => deck.id === prev)) return prev;
        return d[0]?.id || "";
      });
    });
    return unsub;
  }, []);

  if (activeGame === "SPEAKING") {
    return (
      <SpeakingGame
        deckId={selectedDeckId}
        onFinish={(score) => {
          setLastScore(score);
          setActiveGame("NONE");
        }}
      />
    );
  }

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
        deckId={selectedDeckId}
        onFinish={(score) => {
          setLastScore(score);
          setActiveGame("NONE");
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTitleRow}>
          <Icon name="gamepad" size={26} color={theme.colors.primary} />
          <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
            Trung Tâm Luyện Tập Arcade
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Rèn luyện phản xạ ghi nhớ từ vựng với các mini-games tương tác.
        </Text>

        {decks.length === 0 ? (
          <DuolingoCard accessibilityLabel="Chưa có bộ thẻ nào">
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Icon name="gamepad" size={48} color={theme.colors.primary} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: theme.colors.textPrimary,
                  marginTop: 12,
                  marginBottom: 4,
                  textAlign: "center",
                }}
              >
                CHƯA CÓ BỘ THẺ NÀO ĐỂ LUYỆN TẬP
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Hãy tạo bộ thẻ đầu tiên của bạn để mở khóa các mini-games luyện phát âm AI, ghép từ nhanh và xếp câu!
              </Text>
              <View style={{ width: "100%" }}>
                <DuolingoButton
                  title="+ TẠO BỘ THẺ MỚI"
                  variant="primary"
                  onPress={() => setIsAIModalOpen(true)}
                />
              </View>
            </View>
          </DuolingoCard>
        ) : (
          <>
            <View style={styles.pickerSection}>
              <DeckPicker
                decks={decks}
                selectedDeckId={selectedDeckId}
                onSelectDeck={(deckId) => setSelectedDeckId(deckId)}
              />
            </View>

            {lastScore !== null && (
              <DuolingoCard accessibilityLabel="Kết quả vừa chơi">
                <View style={styles.scoreRow}>
                  <Icon name="celebrate" color={theme.colors.primary} />
                  <Text style={[styles.scoreText, { color: theme.colors.primary }]}>
                    Kết quả trận gần nhất: {lastScore} Điểm!
                  </Text>
                </View>
              </DuolingoCard>
            )}

            {/* Mini Game 1: Speaking AI */}
            <DuolingoCard accessibilityLabel="Game Luyện Phát Âm AI">
              <View style={styles.gameRow}>
                <View style={styles.gameInfo}>
                  <Icon name="sparkles" size={32} color={theme.colors.primary} />
                  <Text style={[styles.gameTitle, { color: theme.colors.textPrimary }]}>
                    Luyện Phát Âm AI
                  </Text>
                  <Text style={[styles.gameDesc, { color: theme.colors.textSecondary }]}>
                    Đọc to Hán tự, AI chấm điểm phát âm & nhận xét giọng nói!
                  </Text>
                </View>
                <View style={styles.gameBtnWrapper}>
                  <DuolingoButton
                    title="LUYỆN NÓI"
                    variant="primary"
                    onPress={() => setActiveGame("SPEAKING")}
                    accessibilityLabel="Bắt đầu game Luyện phát âm AI"
                  />
                </View>
              </View>
            </DuolingoCard>

            {/* Mini Game 2: Speed Match */}
            <DuolingoCard accessibilityLabel="Game Ghép Từ Nhanh 60s">
              <View style={styles.gameRow}>
                <View style={styles.gameInfo}>
                  <Icon name="zap" size={32} color={theme.colors.secondary} />
                  <Text style={[styles.gameTitle, { color: theme.colors.textPrimary }]}>
                    Ghép Từ Nhanh 60s
                  </Text>
                  <Text style={[styles.gameDesc, { color: theme.colors.textSecondary }]}>
                    Nối chữ Hán với nghĩa đúng trước khi hết giờ!
                  </Text>
                </View>
                <View style={styles.gameBtnWrapper}>
                  <DuolingoButton
                    title="CHƠI NGAY"
                    variant="secondary"
                    onPress={() => setActiveGame("SPEED_MATCH")}
                    accessibilityLabel="Bắt đầu chơi game Ghép từ nhanh 60s"
                  />
                </View>
              </View>
            </DuolingoCard>

            {/* Mini Game 3: Sentence Builder */}
            <DuolingoCard accessibilityLabel="Game Xếp Từ Thành Câu">
              <View style={styles.gameRow}>
                <View style={styles.gameInfo}>
                  <Icon name="puzzle" size={32} color={theme.colors.info} />
                  <Text style={[styles.gameTitle, { color: theme.colors.textPrimary }]}>
                    Xếp Từ Thành Câu
                  </Text>
                  <Text style={[styles.gameDesc, { color: theme.colors.textSecondary }]}>
                    Sắp xếp các thẻ từ vựng thành câu tiếng Trung hoàn chỉnh.
                  </Text>
                </View>
                <View style={styles.gameBtnWrapper}>
                  <DuolingoButton
                    title="BẮT ĐẦU"
                    variant="info"
                    onPress={() => setActiveGame("SENTENCE_BUILDER")}
                    accessibilityLabel="Bắt đầu chơi game Xếp từ thành câu"
                  />
                </View>
              </View>
            </DuolingoCard>
          </>
        )}
      </ScrollView>

      {/* AI Add Card Modal */}
      <AIAddCardModal visible={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
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
    gap: 8,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
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
  gameBtnWrapper: {
    minWidth: 135,
  },
});
