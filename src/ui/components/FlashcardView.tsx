import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { CardEntity } from "../../domain/card/cardEntity.js";
import { Rating } from "../../domain/fsrs/fsrsTypes.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
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
  const { theme: activeTheme } = useTheme();
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // 3D Flip Animated Value (0 to 180 degrees)
  const flipAnim = useRef(new Animated.Value(0)).current;
  // TikTok-style Swipe Animated Position (x, y)
  const swipeAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Reset card state when card ID changes
  useEffect(() => {
    setIsFlipped(false);
    flipAnim.setValue(0);
    swipeAnim.setValue({ x: 0, y: 0 });
  }, [card.id]);

  const toggleFlip = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  // 3D Flip Interpolation
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  // TikTok-style Swipe Gesture Handler & Tap Handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: Animated.event([null, { dx: swipeAnim.x, dy: swipeAnim.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        // Swipe Up or Left -> Next Card (TikTok style)
        if (gestureState.dy < -60 || gestureState.dx < -60) {
          Animated.timing(swipeAnim, {
            toValue: { x: gestureState.dx < -60 ? -500 : 0, y: gestureState.dy < -60 ? -500 : 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            swipeAnim.setValue({ x: 0, y: 0 });
            onNext();
          });
        }
        // Swipe Down or Right -> Previous Card
        else if ((gestureState.dy > 60 || gestureState.dx > 60) && onPrev && currentIndex > 0) {
          Animated.timing(swipeAnim, {
            toValue: { x: gestureState.dx > 60 ? 500 : 0, y: gestureState.dy > 60 ? 500 : 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            swipeAnim.setValue({ x: 0, y: 0 });
            onPrev();
          });
        }
        // Tap detected (movement <= 10px) -> Toggle 3D Flip
        else if (Math.abs(gestureState.dx) <= 10 && Math.abs(gestureState.dy) <= 10) {
          Animated.spring(swipeAnim, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
          toggleFlip();
        }
        // Release without swipe -> Snap back smoothly
        else {
          Animated.spring(swipeAnim, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

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

  const [nowMs] = useState<number>(() => Date.now());

  const computeCardRetrievability = (): number => {
    if (!card.fsrsState || card.fsrsState.stability <= 0) return 1.0;
    const lastTime = card.fsrsState.last_review
      ? new Date(card.fsrsState.last_review).getTime()
      : new Date(card.createdAt).getTime();
    const elapsedDays = Math.max(0, (nowMs - lastTime) / (1000 * 60 * 60 * 24));
    return Math.max(0.1, Math.min(1.0, Math.exp(-elapsedDays / card.fsrsState.stability)));
  };

  return (
    <View style={styles.container}>
      {/* Top Status Bar */}
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
          <Icon
            name="sparkles"
            size={24}
            color={isPlayingAudio ? activeTheme.colors.secondary : activeTheme.colors.primary}
          />
        </Pressable>
      </View>

      {/* Swipe Gesture Interactive Card Container */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardTouchArea,
          {
            transform: [
              { translateX: swipeAnim.x },
              { translateY: swipeAnim.y },
              {
                rotate: swipeAnim.x.interpolate({
                  inputRange: [-200, 0, 200],
                  outputRange: ["-10deg", "0deg", "10deg"],
                }),
              },
            ],
          },
        ]}
      >
        <DuolingoCard accessibilityLabel={`Thẻ từ vựng ${card.kanji}`}>
          <View style={styles.cardInner}>
            {/* FRONT SIDE (3D Flip Animation) */}
            <Animated.View
              pointerEvents={isFlipped ? "none" : "auto"}
              style={[
                styles.sideContent,
                isFlipped && styles.hiddenSide,
                {
                  transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
                  opacity: frontOpacity,
                },
              ]}
            >
              <Text style={[styles.frontKanji, { color: activeTheme.colors.textPrimary }]}>
                {card.kanji}
              </Text>
              <View style={styles.flipHint}>
                <Icon name="brain" size={16} color={activeTheme.colors.info} />
                <Text style={styles.flipHintText}>CHẠM ĐỂ LẬT THẺ 3D</Text>
              </View>
            </Animated.View>

            {/* BACK SIDE (REVEALED 3D) */}
            <Animated.View
              pointerEvents={isFlipped ? "auto" : "none"}
              style={[
                styles.sideContent,
                !isFlipped && styles.backSideAbsolute,
                {
                  transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
                  opacity: backOpacity,
                },
              ]}
            >
              <Text style={[styles.backKanji, { color: activeTheme.colors.textPrimary }]}>
                {card.kanji}
              </Text>
              <Text style={[styles.pinyinText, { color: activeTheme.colors.primary }]}>
                {card.pinyin}
              </Text>
              <Text style={[styles.meaningText, { color: activeTheme.colors.textSecondary }]}>
                {card.meaning}
              </Text>

              {card.exampleSentence && (
                <View style={[styles.exampleBox, { backgroundColor: activeTheme.badges.neutral.bg }]}>
                  <Text style={[styles.exampleText, { color: activeTheme.colors.textPrimary }]}>
                    Ví dụ: {card.exampleSentence}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>
        </DuolingoCard>
      </Animated.View>

      {/* Swipe Navigation Hint (only shown when front side is visible) */}
      {!isFlipped && (
        <View style={styles.swipeHintContainer}>
          <Text style={[styles.swipeHintText, { color: activeTheme.colors.textSecondary }]}>
            ⬆️ Vuốt lên / ⬅️ vuốt sang để xem từ tiếp theo
          </Text>
        </View>
      )}

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

      {/* Manual Button Controls */}
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
    marginBottom: theme.spacing.md,
  },
  audioBtn: {
    padding: theme.spacing.xs,
  },
  cardTouchArea: {
    marginBottom: theme.spacing.md,
  },
  cardInner: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  sideContent: {
    alignItems: "center",
    width: "100%",
    backfaceVisibility: "hidden",
  },
  hiddenSide: {
    position: "absolute",
    opacity: 0,
  },
  backSideAbsolute: {
    position: "absolute",
    top: theme.spacing.xl,
    left: theme.spacing.md,
    right: theme.spacing.md,
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
    fontSize: 44,
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
    marginBottom: theme.spacing.md,
  },
  exampleBox: {
    backgroundColor: theme.badges.neutral.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    width: "100%",
    marginTop: theme.spacing.sm,
  },
  exampleText: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
  },
  swipeHintContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: "600",
  },
  navRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
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
