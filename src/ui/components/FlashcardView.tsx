import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CardEntity } from "../../domain/card/cardEntity.js";
import { Rating } from "../../domain/fsrs/fsrsTypes.js";
import { theme } from "../theme/theme.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { FSRSRatingButtons } from "./FSRSRatingButtons.js";
import { Icon } from "./Icon.js";
import { RetrievabilityBadge } from "./RetrievabilityBadge.js";
import { StatusBadge } from "./StatusBadge.js";

export interface FlashcardViewProps {
  card: CardEntity;
  currentIndex: number;
  totalCards: number;
  onNext: () => void;
  onPrev?: () => void;
  onRating?: (rating: Rating) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  card,
  currentIndex,
  totalCards,
  onNext,
  onPrev,
  onRating,
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const computeCardRetrievability = (): number => {
    if (!card.fsrsState || card.fsrsState.stability <= 0) return 1.0;
    const lastTime = card.fsrsState.last_review
      ? new Date(card.fsrsState.last_review).getTime()
      : new Date(card.createdAt).getTime();
    const elapsedDays = Math.max(0, (Date.now() - lastTime) / (1000 * 60 * 60 * 24));
    return Math.max(0.1, Math.min(1.0, Math.exp(-elapsedDays / card.fsrsState.stability)));
  };

  return (
    <View style={styles.container}>
      {/* Top status bar */}
      <View style={styles.statusBar}>
        <StatusBadge variant="new" label={`THẺ ${currentIndex + 1}/${totalCards}`} />

        {isFlipped && card.fsrsState && (
          <RetrievabilityBadge retrievability={computeCardRetrievability()} />
        )}

        <Pressable
          onPress={() => speakText(card.kanji)}
          accessibilityLabel={`Phát âm từ ${card.kanji}`}
          style={styles.audioBtn}
        >
          <Icon name="sparkles" size={24} color={isPlayingAudio ? theme.colors.secondary : theme.colors.primary} />
        </Pressable>
      </View>

      {/* Main Flashcard Container */}
      <Pressable onPress={handleFlip} style={styles.cardTouchArea}>
        <DuolingoCard accessibilityLabel={`Thẻ từ vựng ${card.kanji}`}>
          <View style={styles.cardInner}>
            {!isFlipped ? (
              // FRONT SIDE
              <View style={styles.sideContent}>
                <Text style={styles.frontKanji}>{card.kanji}</Text>
                <View style={styles.flipHint}>
                  <Icon name="brain" size={16} color={theme.colors.info} />
                  <Text style={styles.flipHintText}>CHẠM ĐỂ XEM ĐÁP ÁN</Text>
                </View>
              </View>
            ) : (
              // BACK SIDE (REVEALED)
              <View style={styles.sideContent}>
                <Text style={styles.backKanji}>{card.kanji}</Text>
                <Text style={styles.pinyinText}>{card.pinyin}</Text>
                <Text style={styles.meaningText}>{card.meaning}</Text>

                {card.exampleSentence && (
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleText}>Ví dụ: {card.exampleSentence}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </DuolingoCard>
      </Pressable>

      {/* FSRS Rating Buttons when answer is revealed */}
      {isFlipped && onRating && (
        <FSRSRatingButtons
          onRate={(rating) => {
            onRating(rating);
            setIsFlipped(false);
            onNext();
          }}
        />
      )}

      {/* Navigation Controls */}
      {!isFlipped && (
        <View style={styles.navRow}>
          {onPrev && currentIndex > 0 && (
            <Pressable onPress={onPrev} style={styles.prevBtn}>
              <Text style={styles.prevBtnText}>← Từ trước</Text>
            </Pressable>
          )}

          <Pressable onPress={onNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Từ tiếp theo →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  audioBtn: {
    padding: theme.spacing.xs,
  },
  cardTouchArea: {
    marginBottom: theme.spacing.lg,
  },
  cardInner: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },
  sideContent: {
    alignItems: "center",
    width: "100%",
  },
  frontKanji: {
    fontSize: 72,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  flipHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  flipHintText: {
    color: theme.colors.info,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  backKanji: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  pinyinText: {
    fontSize: theme.fontSize.xxl,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  meaningText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  exampleBox: {
    backgroundColor: theme.badges.neutral.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    width: "100%",
    marginTop: theme.spacing.md,
  },
  exampleText: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
  },
  navRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.white,
    alignItems: "center",
  },
  prevBtnText: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  nextBtnText: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
});
