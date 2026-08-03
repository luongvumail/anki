import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../store/slices/types";
import { useStore } from "../../store/useStore";
import { recordReviewToday } from "../../lib/reviewTracker";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { DuolingoCard } from "../ui/DuolingoCard";
import { ProgressBar } from "../ui/ProgressBar";

interface SentenceExercise {
  card: Card;
  fullChinese: string;
  pinyin: string;
  vietnamese: string;
  wordChips: string[];
}

export interface SentenceBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  cards: Card[];
}

function splitChineseSentence(sentence: string): string[] {
  // Utility to split Chinese sentence into word tokens
  const clean = sentence.replace(/[.,!?。，！？]/g, "");
  const chars = Array.from(clean).filter((c) => c.trim().length > 0);
  return chars;
}

const COMMON_DISTRACTOR_TOKENS = [
  "的", "了", "在", "是", "不", "也", "都", "和", "就", "过", "会", "很", "有", "要", "去", "这", "那"
];

function getDistractorTokens(sentenceTokens: string[], count = 2): string[] {
  const existingSet = new Set(sentenceTokens);
  const candidates = COMMON_DISTRACTOR_TOKENS.filter((t) => !existingSet.has(t));
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function SentenceBuilderModal({ visible, onClose, cards }: SentenceBuilderModalProps) {
  const insets = useSafeAreaInsets();
  const addXP = useStore((s) => s.addXP);

  const [exercises, setExercises] = useState<SentenceExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChips, setSelectedChips] = useState<{ id: number; text: string }[]>([]);
  const [allChips, setAllChips] = useState<{ id: number; text: string }[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const selectedChipIds = useMemo(() => new Set(selectedChips.map((c) => c.id)), [selectedChips]);

  const drawerAnim = useRef(new Animated.Value(300)).current;

  // Prepare exercises from cards with examples
  useEffect(() => {
    if (visible && cards.length > 0) {
      const validCards = cards.filter(
        (c) => c.examples && c.examples.length > 0 && c.examples[0].chinese,
      );
      const shuffledCards = [...validCards].sort(() => 0.5 - Math.random());
      const selected = shuffledCards.slice(0, 5);

      const generated: SentenceExercise[] = selected.map((c) => {
        const ex = c.examples[0];
        const tokens = splitChineseSentence(ex.chinese);
        return {
          card: c,
          fullChinese: ex.chinese,
          pinyin: ex.pinyin,
          vietnamese: ex.vietnamese,
          wordChips: tokens,
        };
      });

      setExercises(generated);
      setCurrentIndex(0);
      setCorrectCount(0);
      setIsDone(false);
      if (generated.length > 0) {
        setupExercise(generated[0]);
      }
    }
  }, [visible, cards]);

  const setupExercise = (ex: SentenceExercise) => {
    setIsChecked(false);
    setIsCorrect(false);
    setSelectedChips([]);
    drawerAnim.setValue(300);

    const mainChips = ex.wordChips.map((text, idx) => ({ id: idx, text }));
    // Add 2 distractor tokens (từ gây nhiễu) to increase challenge
    const distractors = getDistractorTokens(ex.wordChips, 2).map((text, idx) => ({
      id: 100 + idx,
      text,
    }));

    const allCombined = [...mainChips, ...distractors];
    const shuffled = [...allCombined].sort(() => 0.5 - Math.random());
    setAllChips(shuffled);
  };

  const handleSelectChip = (chip: { id: number; text: string }) => {
    if (isChecked || selectedChipIds.has(chip.id)) return;
    triggerHaptic("selection");
    setSelectedChips((prev) => [...prev, chip]);
  };

  const handleUnselectChip = (chip: { id: number; text: string }) => {
    if (isChecked) return;
    triggerHaptic("selection");
    setSelectedChips((prev) => prev.filter((c) => c.id !== chip.id));
  };

  const handleCheck = () => {
    if (selectedChips.length === 0 || isChecked) return;

    const currentEx = exercises[currentIndex];
    const userBuilt = selectedChips.map((c) => c.text).join("");
    const targetClean = splitChineseSentence(currentEx.fullChinese).join("");

    const correct = userBuilt === targetClean;
    setIsCorrect(correct);
    setIsChecked(true);
    recordReviewToday().catch(() => {});

    if (correct) {
      triggerHaptic("success");
      setCorrectCount((prev) => prev + 1);
      addXP(15);
    } else {
      triggerHaptic("error");
    }

    Animated.spring(drawerAnim, {
      toValue: 0,
      tension: 65,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleContinue = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= exercises.length) {
      setIsChecked(false);
      setIsDone(true);
    } else {
      setCurrentIndex(nextIdx);
      setupExercise(exercises[nextIdx]);
    }
  };

  if (exercises.length === 0) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Chưa có câu ví dụ!</Text>
            <Text style={styles.emptySub}>
              Thêm từ vựng bằng AI để tự động tạo các câu ví dụ luyện tập.
            </Text>
            <DuolingoButton
              title="ĐÓNG"
              variant="secondary"
              size="md"
              onPress={onClose}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>
    );
  }

  const currentEx = exercises[currentIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={Colors.duolingo.textMuted} />
          </TouchableOpacity>
          <ProgressBar
            progress={(currentIndex + 1) / Math.max(1, exercises.length)}
            height={12}
            fillColor={Colors.duolingo.blue}
            style={{ flex: 1 }}
          />
          <Text style={styles.headerProgressText}>
            {currentIndex + 1}/{exercises.length}
          </Text>
        </View>

        {!isDone ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Translation Prompt Card */}
            <DuolingoCard style={styles.promptCard}>
              <Text style={styles.promptLabel}>DỊCH CÂU SAU SANG TIẾNG TRUNG:</Text>
              <Text style={styles.promptTranslation}>"{currentEx.vietnamese}"</Text>
            </DuolingoCard>

            {/* Selected Chips Drop Zone */}
            <View style={styles.dropZone}>
              {selectedChips.length === 0 ? (
                <Text style={styles.dropZonePlaceholder}>Chạm các từ phía dưới để xếp câu...</Text>
              ) : (
                <View style={styles.chipGrid}>
                  {selectedChips.map((chip) => (
                    <TouchableOpacity
                      key={`sel-${chip.id}`}
                      style={styles.chipSelected}
                      onPress={() => handleUnselectChip(chip)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipTextSelected}>{chip.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Available Chips Pool */}
            <View style={styles.chipsPool}>
              <View style={styles.chipGrid}>
                {allChips.map((chip) => {
                  const isSelected = selectedChipIds.has(chip.id);
                  return isSelected ? (
                    <View key={`avail-empty-${chip.id}`} style={styles.chipSlotEmpty}>
                      <Text style={[styles.chipTextAvailable, { opacity: 0 }]}>{chip.text}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      key={`avail-${chip.id}`}
                      style={styles.chipAvailable}
                      onPress={() => handleSelectChip(chip)}
                      activeOpacity={0.85}
                      disabled={isChecked}
                    >
                      <Text style={styles.chipTextAvailable}>{chip.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Completion Screen with Adaptive Evaluation Message */
          <View style={styles.doneContainer}>
            <View style={styles.doneIconCircle}>
              <Ionicons
                name={
                  correctCount === exercises.length
                    ? "trophy"
                    : correctCount >= exercises.length / 2
                      ? "checkmark-circle"
                      : "alert-circle"
                }
                size={48}
                color={
                  correctCount === exercises.length
                    ? Colors.duolingo.yellow
                    : correctCount >= exercises.length / 2
                      ? Colors.duolingo.green
                      : Colors.duolingo.red
                }
              />
            </View>

            <Text style={styles.doneTitle}>
              {correctCount === exercises.length
                ? "XUẤT SẮC! 太棒了!"
                : correctCount >= exercises.length / 2
                  ? "RẤT TỐT!"
                  : "CẦN CỐ GẮNG HƠN!"}
            </Text>

            <Text style={styles.doneSub}>
              {correctCount === exercises.length
                ? `Bạn đã xếp đúng tuyệt đối ${correctCount}/${exercises.length} câu ví dụ!`
                : correctCount >= exercises.length / 2
                  ? `Bạn đã xếp đúng ${correctCount}/${exercises.length} câu ví dụ. Tiếp tục phát huy nhé!`
                  : `Bạn chỉ xếp đúng ${correctCount}/${exercises.length} câu. Hãy luyện tập thêm để làm quen cấu trúc câu!`}
            </Text>

            <DuolingoButton
              title="HOÀN TẤT"
              variant={correctCount >= exercises.length / 2 ? "primary" : "ghost"}
              size="lg"
              onPress={onClose}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        )}

        {/* Bottom Check Bar */}
        {!isChecked && !isDone && (
          <View style={styles.bottomBar}>
            <DuolingoButton
              title="KIỂM TRA"
              variant="primary"
              size="lg"
              disabled={selectedChips.length === 0}
              onPress={handleCheck}
            />
          </View>
        )}

        {/* Feedback Sheet */}
        {isChecked && !isDone && (
          <Animated.View
            style={[
              styles.resultDrawer,
              isCorrect ? styles.drawerCorrect : styles.drawerWrong,
              { transform: [{ translateY: drawerAnim }] },
            ]}
          >
            <View style={styles.resultTitleRow}>
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={26}
                color={isCorrect ? Colors.duolingo.green : Colors.duolingo.red}
              />
              <Text
                style={[
                  styles.resultTitle,
                  { color: isCorrect ? Colors.duolingo.green : Colors.duolingo.red },
                ]}
              >
                {isCorrect ? "Chính xác! (+15 XP)" : "Chưa chính xác"}
              </Text>
            </View>
            <View style={{ marginTop: 4 }}>
              <Text style={styles.explainValue}>{currentEx.fullChinese}</Text>
              {currentEx.pinyin ? (
                <Text style={styles.explainPinyin}>{currentEx.pinyin}</Text>
              ) : null}
              {currentEx.vietnamese ? (
                <Text style={styles.explainSubText}>{currentEx.vietnamese}</Text>
              ) : null}
            </View>
            <DuolingoButton
              title={isCorrect ? "TIẾP TỤC" : "ĐÃ HIỂU"}
              variant={isCorrect ? "primary" : "error"}
              size="lg"
              onPress={handleContinue}
              style={{ marginTop: Spacing.sm }}
            />
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.duolingo.bg, position: "relative" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.pageMargin,
    marginBottom: Spacing.md,
    gap: 12,
  },
  closeBtn: { padding: 4 },
  headerProgressText: { fontSize: 13, fontWeight: "800", color: Colors.duolingo.blue },
  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingBottom: 120 },

  promptCard: {
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: Colors.duolingo.cardBottom,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.duolingo.blue,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  promptTranslation: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", lineHeight: 24 },

  dropZone: {
    minHeight: 110,
    backgroundColor: "#131F24",
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.duolingo.border,
    borderStyle: "dashed",
    justifyContent: "center",
  },
  dropZonePlaceholder: {
    color: Colors.duolingo.textMuted,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },

  chipsPool: { minHeight: 120 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chipAvailable: {
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "transparent",
    borderBottomWidth: 3,
    borderBottomColor: Colors.duolingo.cardBottom,
  },
  chipTextAvailable: { fontSize: 18, fontWeight: "800", color: Colors.text.white },
  chipSlotEmpty: {
    backgroundColor: "#18242B",
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#2B3D4F",
    borderStyle: "dashed",
  },
  chipSelected: {
    backgroundColor: Colors.duolingo.blue,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "transparent",
    borderBottomWidth: 3,
    borderBottomColor: Colors.duolingo.blueDark,
  },
  chipTextSelected: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.duolingo.bg,
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  resultDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
    paddingBottom: Math.max(Spacing.lg, 24),
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
  },
  drawerCorrect: { backgroundColor: "#193318" },
  drawerWrong: { backgroundColor: "#381616" },
  resultTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  resultTitle: { fontSize: 22, fontWeight: "800" },
  explainValue: { fontSize: 20, fontWeight: "800", color: "#FFFFFF", marginTop: 2 },
  explainPinyin: { fontSize: 16, fontWeight: "700", color: Colors.duolingo.blue, marginTop: 2 },
  explainSubText: { fontSize: 15, fontWeight: "600", color: "rgba(255, 255, 255, 0.85)", marginTop: 2 },

  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  emptySub: { fontSize: 14, color: Colors.duolingo.textMuted, textAlign: "center", marginTop: 6 },
  doneContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  doneIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.duolingo.cardBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  doneTitle: { fontSize: 24, fontWeight: "800", color: Colors.text.white },
  doneSub: { fontSize: 14, color: Colors.duolingo.textMuted, marginTop: 6, textAlign: "center", lineHeight: 20 },
});
