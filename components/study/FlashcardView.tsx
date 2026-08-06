import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  useWindowDimensions,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Colors, Radii, Spacing, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { AudioButton } from "../ui/AudioButton";

import { RetrievabilityBadge } from "./fsrs/RetrievabilityBadge";
import { FSRSRatingButtons } from "./fsrs/FSRSRatingButtons";
import { Rating, State } from "@/src/domain/fsrs/fsrsTypes";
import { ensureFSRSState, CardEntity } from "@/src/domain/card/cardEntity";

interface FlashcardViewProps {
  card: CardEntity;
  currentIndex: number;
  totalCards: number;
  onNext: () => void;
  onPrev?: () => void;
  onRating?: (rating: Rating) => void;
}

const SWIPE_THRESHOLD = 50;

/**
 * Clean Character Display Tile (Borderless & Minimalist)
 */
function CharacterTile({ text, fontSize = 84 }: { text: string; fontSize?: number }) {
  return (
    <View style={styles.characterTileContainer}>
      <Text style={[styles.characterHero, { fontSize }]}>{text}</Text>
    </View>
  );
}

export function FlashcardView({
  card,
  currentIndex,
  totalCards,
  onNext,
  onPrev,
  onRating,
}: FlashcardViewProps) {
  const cardEntity = card as unknown as CardEntity;
  const { height } = useWindowDimensions();
  const [showAnswer, setShowAnswer] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Smooth gesture & transition animations
  const pan = useRef(new Animated.ValueXY()).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;

  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;

    // Reset card state and trigger smooth fade-in
    setShowAnswer(false);
    revealAnim.setValue(0);
    pan.setValue({ x: 0, y: 15 });
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      Speech.stop();
    };
  }, [card, pan, opacityAnim, revealAnim, onNext, onPrev]);

  const handleCardTap = () => {
    if (showAnswer) return;
    setShowAnswer(true);
    triggerHaptic("light");

    Animated.timing(revealAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const playTTS = async (textToSpeak?: string) => {
    try {
      setSpeaking(true);
      Speech.stop();
      Speech.speak(textToSpeak || card.character, {
        language: "zh-CN",
        rate: 0.85,
        onDone: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch {
      setSpeaking(false);
    }
  };

  const executeSwipeUp = () => {
    triggerHaptic("selection");
    Animated.parallel([
      Animated.timing(pan.y, {
        toValue: -height * 0.4,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNextRef.current();
    });
  };

  const executeSwipeDown = () => {
    if (currentIndex === 0 || !onPrevRef.current) {
      triggerHaptic("warning");
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }).start();
      return;
    }

    triggerHaptic("selection");
    Animated.parallel([
      Animated.timing(pan.y, {
        toValue: height * 0.4,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPrevRef.current?.();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dy) > 12 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: 0, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;

        if (dy < -SWIPE_THRESHOLD || vy < -0.35) {
          executeSwipeUp();
        } else if (dy > SWIPE_THRESHOLD || vy > 0.35) {
          executeSwipeDown();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 8,
            tension: 90,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const isLastCard = currentIndex >= totalCards - 1;

  const answerTranslateY = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const answerOpacity = revealAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardArea}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.animatedCardContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: pan.y }],
            },
          ]}
        >
          <TouchableOpacity style={styles.cardBody} activeOpacity={0.97} onPress={handleCardTap}>
            {/* CLEAN TOP HEADER */}
            <View style={styles.cardTopHeader}>
              <View style={styles.counterBadge}>
                <Ionicons name="card" size={14} color={Colors.duolingo.blue} />
                <Text style={styles.counterBadgeText}>
                  THẺ {currentIndex + 1}/{totalCards}
                </Text>
              </View>

              {showAnswer && cardEntity.fsrs && (
                <RetrievabilityBadge
                  stability={cardEntity.fsrs.stability}
                  lastReview={cardEntity.fsrs.last_review}
                  state={cardEntity.fsrs.state}
                />
              )}

              {/* Speaker Audio Button (Only on Unrevealed state to avoid duplicate icons) */}
              {!showAnswer && (
                <AudioButton
                  onPress={playTTS}
                  isPlaying={speaking}
                  size="sm"
                />
              )}
            </View>

            {/* UNREVEALED STATE: CLEAN HERO CHARACTER + TAP PROMPT */}
            {!showAnswer ? (
              <View style={styles.unrevealedCenterContainer}>
                <CharacterTile text={card.character} fontSize={96} />

                {/* Tap to Flip Prompt Chip */}
                <View style={styles.tapToFlipChip}>
                  <Ionicons name="finger-print-outline" size={16} color={Colors.duolingo.blue} />
                  <Text style={styles.tapToFlipText}>CHẠM ĐỂ XEM ĐÁP ÁN</Text>
                </View>
              </View>
            ) : (
              /* REVEALED STATE: UNIFIED CENTERED FLOW */
              <Animated.View
                style={[
                  styles.answerSlideContainer,
                  {
                    opacity: answerOpacity,
                    transform: [{ translateY: answerTranslateY }],
                  },
                ]}
              >
                <ScrollView
                  style={{ width: "100%", flex: 1 }}
                  contentContainerStyle={styles.answerScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Word Header Row */}
                  <View style={styles.revealedHeaderRow}>
                    <CharacterTile text={card.character} fontSize={52} />
                    <View style={styles.revealedMainInfo}>
                      <View style={styles.pinyinRow}>
                        <Text style={styles.pinyinText}>{card.pinyin}</Text>
                        <AudioButton
                          onPress={playTTS}
                          isPlaying={speaking}
                          size="sm"
                        />
                      </View>
                      <Text style={styles.translationText}>{card.translation}</Text>
                    </View>
                  </View>

                  {/* RADICAL BREAKDOWN BOX */}
                  {card.radical ? (
                    <View style={styles.radicalBreakdownBox}>
                      <Ionicons name="layers-outline" size={16} color={Colors.duolingo.purple} style={{ marginTop: 2 }} />
                      <Text style={styles.radicalContentText}>{card.radical}</Text>
                    </View>
                  ) : null}

                  {/* EXAMPLES CONTAINER */}
                  {card.examples && card.examples.length > 0 && (
                    <View style={styles.examplesBox}>
                      <View style={styles.examplesHeaderRow}>
                        <Ionicons name="book-outline" size={14} color={Colors.duolingo.yellow} />
                        <Text style={styles.examplesHeader}>CÂU VÍ DỤ MINH HỌA</Text>
                      </View>

                      {card.examples.map((ex, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.exampleItem}
                          activeOpacity={0.8}
                          onPress={(e) => {
                            e.stopPropagation();
                            playTTS(ex.chinese);
                          }}
                        >
                          <View style={styles.exampleTextCol}>
                            <Text style={styles.exampleCn}>{ex.chinese}</Text>
                            {ex.pinyin && <Text style={styles.examplePy}>{ex.pinyin}</Text>}
                            <Text style={styles.exampleVi}>{ex.vietnamese}</Text>
                          </View>
                          <Ionicons name="volume-medium-outline" size={18} color={Colors.duolingo.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            )}

            {/* FSRS 3D Rating Buttons when Answer is Revealed */}
            {showAnswer && onRating && (
              <FSRSRatingButtons
                card={card as any}
                onRating={(rating: Rating) => {
                  onRating(rating);
                  onNext();
                }}
              />
            )}

            {/* Bottom Swipe Guide Pill */}
            {!showAnswer && (
              <View style={styles.gestureGuidePill}>
                <Ionicons name="swap-vertical" size={14} color={Colors.duolingo.textMuted} />
                <Text style={styles.gestureGuideText}>Vuốt lên để xem tiếp • Vuốt xuống để quay lại</Text>
              </View>
            )}

            {/* ONLY ON LAST CARD & REVEALED: START QUIZ BUTTON */}
            {isLastCard && showAnswer && (
              <View style={styles.lastCardActionBox}>
                <DuolingoButton
                  title="BẮT ĐẦU KIỂM TRA QUIZ"
                  variant="primary"
                  size="lg"
                  onPress={executeSwipeUp}
                />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.md,
    justifyContent: "center",
    overflow: "hidden",
  },
  cardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.xs,
    overflow: "hidden",
  },
  animatedCardContainer: {
    width: "100%",
    height: "100%",
  },
  cardBody: {
    flex: 1,
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.xl,
    borderBottomWidth: 4,
    borderBottomColor: Colors.duolingo.cardBottom,
    padding: Spacing.lg,
    position: "relative",
    justifyContent: "space-between",
  },
  cardTopHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.duolingo.blueDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  counterBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.text.white,
    letterSpacing: 0.5,
  },
  headerAudioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.duolingo.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },
  unrevealedCenterContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 24,
  },
  characterTileContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  characterHero: {
    fontWeight: "800",
    color: Colors.text.white,
    textAlign: "center",
    letterSpacing: 1,
  },
  tapToFlipChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.duolingo.blueDim,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radii.full,
  },
  tapToFlipText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.blue,
    letterSpacing: 0.6,
  },
  answerSlideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: 4,
  },
  revealedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
    marginVertical: 6,
  },
  revealedMainInfo: {
    flex: 1,
    justifyContent: "center",
  },
  pinyinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pinyinText: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.duolingo.blue,
  },
  audioIconBtn3D: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.duolingo.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },
  translationText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.duolingo.green,
    marginTop: 2,
  },
  radicalBreakdownBox: {
    width: "100%",
    backgroundColor: Colors.duolingo.purpleDim,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  radicalContentText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.white,
    lineHeight: 18,
  },
  answerScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
  },
  examplesBox: {
    width: "100%",
    backgroundColor: Colors.duolingo.bg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: 12,
  },
  examplesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  examplesHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.duolingo.yellow,
    letterSpacing: 0.8,
  },
  exampleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  exampleTextCol: {
    flex: 1,
    marginRight: 8,
  },
  exampleCn: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.white,
  },
  examplePy: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.duolingo.blue,
    marginTop: 2,
  },
  exampleVi: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.duolingo.textMuted,
    marginTop: 2,
  },
  gestureGuidePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 8,
  },
  gestureGuideText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.duolingo.textMuted,
  },
  lastCardActionBox: {
    width: "100%",
    marginTop: 8,
  },
});
