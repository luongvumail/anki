import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme.js";
import { DuolingoButton } from "./DuolingoButton.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";
import { ProgressBar } from "./ProgressBar.js";
import { StatusBadge } from "./StatusBadge.js";
import { appStore } from "../store/useAppStore.js";

import { useTheme } from "../theme/ThemeContext.js";

export interface SentenceBuilderGameProps {
  deckId?: string;
  onFinish: (score: number) => void;
}

interface SentenceExercise {
  id: string;
  vietnamese: string;
  pinyin: string;
  fullChinese: string;
  tokens: string[];
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function splitChineseSentence(sentence: string): string[] {
  if (sentence.includes(",")) {
    return sentence.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return Array.from(sentence).filter((ch) => ch.trim().length > 0);
}

export const SentenceBuilderGame: React.FC<SentenceBuilderGameProps> = ({ deckId, onFinish }) => {
  const { theme: activeTheme } = useTheme();
  const [exercises, setExercises] = useState<SentenceExercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedChips, setSelectedChips] = useState<{ id: number; text: string }[]>([]);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  React.useEffect(() => {
    setIsLoading(true);
    if (!deckId) {
      setExercises([]);
      setIsLoading(false);
      return;
    }

    const cards = appStore.getState().cards[deckId] || [];
    if (cards.length === 0) {
      setExercises([]);
      setIsLoading(false);
      return;
    }

    // Collect all kanji from the deck for distractors
    const allDeckKanji = Array.from(new Set(cards.map((c) => c.kanji)));

    const built: SentenceExercise[] = cards.slice(0, 10).map((card, idx) => {
      const fullText = card.exampleSentence && card.exampleSentence.trim().length > 0
        ? card.exampleSentence
        : card.kanji;
      const primaryTokens = splitChineseSentence(fullText);

      // Grab distractors from other cards in the deck
      const distractors = allDeckKanji.filter((k) => !primaryTokens.includes(k)).slice(0, 3);
      const allTokens = Array.from(new Set([...primaryTokens, ...distractors]));

      return {
        id: `ex_${idx}`,
        vietnamese: card.meaning,
        pinyin: card.pinyin,
        fullChinese: fullText,
        tokens: allTokens,
      };
    });

    setExercises(built);
    setIsLoading(false);
  }, [deckId]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: activeTheme.colors.textSecondary }}>Đang tải bài tập...</Text>
      </View>
    );
  }

  if (exercises.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", padding: 16 }]}>
        <DuolingoCard accessibilityLabel="Chưa có từ vựng">
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <Icon name="puzzle" size={48} color={theme.colors.info} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: activeTheme.colors.textPrimary,
                marginTop: 12,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              BỘ THẺ NÀY CHƯA CÓ TỪ VỰNG
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: activeTheme.colors.textSecondary,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Vui lòng thêm từ vựng vào bộ thẻ để bắt đầu chơi mini-game xếp từ thành câu!
            </Text>
            <View style={{ width: "100%" }}>
              <DuolingoButton
                title="QUAY LẠI"
                variant="primary"
                onPress={() => onFinish(0)}
              />
            </View>
          </View>
        </DuolingoCard>
      </View>
    );
  }

  const currentEx = exercises[currentIndex];

  const allChips = React.useMemo(() => {
    if (!currentEx) return [];
    return shuffleArray(currentEx.tokens).map((token, index) => ({
      id: index,
      text: token,
    }));
  }, [currentEx]);

  if (isDone || !currentEx) {
    return (
      <View style={styles.doneContainer}>
        <DuolingoCard accessibilityLabel="Kết quả trò chơi xếp từ">
          <View style={styles.doneCardContent}>
            <Icon name="trophy" size={64} color={theme.colors.secondary} />
            <Text style={styles.doneTitle}>Hoàn Thành Thử Thách!</Text>
            <Text style={styles.doneScore}>Điểm số đạt được: {score} Điểm</Text>
            <DuolingoButton
              title="VỀ TRUNG TÂM ARCADE"
              variant="primary"
              onPress={() => onFinish(score)}
            />
          </View>
        </DuolingoCard>
      </View>
    );
  }

  const selectedChipIds = new Set(selectedChips.map((c) => c.id));

  const handleSelectChip = (chip: { id: number; text: string }) => {
    if (isChecked) return;
    if (selectedChipIds.has(chip.id)) {
      setSelectedChips(selectedChips.filter((c) => c.id !== chip.id));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  const handleCheckAnswer = () => {
    if (isChecked) {
      if (currentIndex + 1 < exercises.length) {
        setCurrentIndex(currentIndex + 1);
        setSelectedChips([]);
        setIsChecked(false);
      } else {
        setIsDone(true);
      }
      return;
    }

    const userAns = selectedChips.map((c) => c.text).join("");
    const targetAns = splitChineseSentence(currentEx.fullChinese).join("");
    const correct = userAns === targetAns;

    setIsCorrect(correct);
    setIsChecked(true);
    if (correct) {
      setScore((s) => s + 10);
    }
  };

  const progressPct = ((currentIndex + 1) / exercises.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topGameHeader}>
        <Pressable
          onPress={() => onFinish(score)}
          style={styles.backBtn}
          accessibilityLabel="Thoát trò chơi ghép câu"
        >
          <Icon name="back" size={22} color={activeTheme.colors.textPrimary} />
          <Text style={[styles.backBtnText, { color: activeTheme.colors.textPrimary }]}>
            Thoát game
          </Text>
        </Pressable>
        <Text style={[styles.gameHeaderTitle, { color: activeTheme.colors.textSecondary }]}>
          XẾP TỪ THÀNH CÂU
        </Text>
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={progressPct} color={theme.colors.info} />
      </View>

      <DuolingoCard accessibilityLabel="Câu hỏi dịch và xếp từ">
        <StatusBadge variant="info" label="XẾP TỪ THÀNH CÂU HOÀN CHỈNH" />
        <Text style={styles.questionPrompt}>Dịch câu sau sang Tiếng Trung:</Text>
        <Text style={styles.vietnameseText}>"{currentEx.vietnamese}"</Text>
        {isChecked && <Text style={styles.pinyinText}>Phiên âm: {currentEx.pinyin}</Text>}
      </DuolingoCard>

      {/* Answer Slots */}
      <View style={styles.slotContainer}>
        {selectedChips.length === 0 ? (
          <Text style={styles.placeholderText}>Nhấp vào các từ bên dưới để xếp câu...</Text>
        ) : (
          selectedChips.map((chip) => (
            <Pressable
              key={chip.id}
              onPress={() => handleSelectChip(chip)}
              disabled={isChecked}
              style={styles.chipSelected}
            >
              <Text style={styles.chipSelectedText}>{chip.text}</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Available Chips */}
      <View style={styles.chipsGrid}>
        {allChips.map((chip) => {
          const isUsed = selectedChipIds.has(chip.id);
          return (
            <Pressable
              key={chip.id}
              onPress={() => handleSelectChip(chip)}
              disabled={isUsed || isChecked}
              style={[
                styles.chipAvailable,
                {
                  backgroundColor: isUsed ? theme.colors.cardBorder : theme.colors.white,
                  borderColor: isUsed ? theme.badges.neutral.border : theme.colors.cardBorder,
                  opacity: isUsed ? 0.4 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipAvailableText,
                  { color: isUsed ? theme.colors.textLight : theme.colors.textPrimary },
                ]}
              >
                {chip.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Result Feedback */}
      {isChecked && (
        <View
          style={[
            styles.feedbackBox,
            {
              backgroundColor: isCorrect ? theme.badges.learned.bg : theme.badges.due.bg,
              borderColor: isCorrect ? theme.colors.primary : theme.colors.danger,
            },
          ]}
        >
          <Icon
            name={isCorrect ? "check" : "wrench"}
            size={20}
            color={isCorrect ? theme.colors.primary : theme.colors.danger}
          />
          <Text
            style={[
              styles.feedbackText,
              { color: isCorrect ? theme.colors.primary : theme.colors.danger },
            ]}
          >
            {isCorrect ? "Chính xác! +10 điểm" : `Sai rồi! Đáp án đúng: ${currentEx.fullChinese}`}
          </Text>
        </View>
      )}

      <DuolingoButton
        title={
          isChecked
            ? currentIndex + 1 < exercises.length
              ? "CÂU TIẾP THEO"
              : "XEM KẾT QUẢ"
            : "KIỂM TRA"
        }
        variant={isChecked ? (isCorrect ? "primary" : "secondary") : "info"}
        disabled={!isChecked && selectedChips.length === 0}
        onPress={handleCheckAnswer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
  },
  progressWrapper: {
    marginBottom: theme.spacing.lg,
  },
  doneContainer: {
    padding: theme.spacing.lg,
  },
  doneCardContent: {
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  doneTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  doneScore: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  questionPrompt: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  vietnameseText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  pinyinText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  slotContainer: {
    minHeight: 70,
    borderBottomWidth: 3,
    borderStyle: "dashed",
    borderBottomColor: theme.colors.cardBorder,
    marginVertical: theme.spacing.lg,
    padding: theme.spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  chipSelected: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.info,
    borderRadius: theme.radius.md,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.infoShadow,
  },
  chipSelectedText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  chipAvailable: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: theme.radius.md,
  },
  chipAvailableText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  feedbackBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    marginBottom: theme.spacing.lg,
  },
  feedbackText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    flex: 1,
  },
  topGameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  gameHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
