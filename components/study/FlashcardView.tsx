import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../store/slices/types";
import { Colors, Spacing, Radii } from "../../constants/theme";
import { AudioButton } from "../ui/AudioButton";
import { getPinyinToneColor } from "../../lib/pinyinColor";
import { useFlashcardAnimation } from "../../hooks/useFlashcardAnimation";

interface FlashcardViewProps {
  card: Card;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCards?: number;
  showNextButton?: boolean;
}

export function FlashcardView({ card, onNext, showNextButton }: FlashcardViewProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - Spacing.pageMargin * 2;

  const {
    isFlipped,
    speaking,
    frontAnimatedStyle,
    backAnimatedStyle,
    handleFlip,
    playTTS,
  } = useFlashcardAnimation(card.character);

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={{ width: cardWidth, height: 380 }}>
        {/* Front Face */}
        <Animated.View style={[styles.cardFace, styles.cardFront, frontAnimatedStyle, { width: cardWidth }]}>
          <Text style={styles.frontCharacter}>{card.character}</Text>

          <View style={styles.audioRow}>
            <AudioButton onPress={playTTS} isPlaying={speaking} size="md" />
          </View>

          <Text style={styles.tapToFlipHint}>Chạm vào thẻ để xem nghĩa &amp; chi tiết</Text>
        </Animated.View>

        {/* Back Face */}
        <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle, { width: cardWidth }]}>
          <ScrollView contentContainerStyle={styles.backScrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.backCharacter}>{card.character}</Text>
            <Text
              style={[
                styles.backPinyin,
                { color: getPinyinToneColor(card.pinyin) },
              ]}
            >
              {card.pinyin}
            </Text>
            <Text style={styles.backTranslation}>{card.translation}</Text>

            {card.hanviet ? (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>Hán Việt: {card.hanviet}</Text>
              </View>
            ) : null}

            {card.radical ? (
              <View style={styles.radicalBox}>
                <Ionicons name="layers-outline" size={14} color={Colors.duolingo.purple} />
                <Text style={styles.radicalText}>{card.radical}</Text>
              </View>
            ) : null}

            {card.examples && card.examples.length > 0 ? (
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleHeader}>CÂU VÍ DỤ:</Text>
                <Text style={styles.exampleCn}>{card.examples[0].chinese}</Text>
                {card.examples[0].pinyin ? (
                  <Text style={styles.examplePy}>{card.examples[0].pinyin}</Text>
                ) : null}
                <Text style={styles.exampleVi}>{card.examples[0].vietnamese}</Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>

      {showNextButton && onNext && (
        <TouchableOpacity style={styles.nextCardBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.nextCardBtnText}>XEM TỪ TIẾP THEO</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardFace: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 380,
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.xl,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  frontCharacter: {
    fontSize: 64,
    fontWeight: "900",
    color: Colors.text.white,
  },
  audioRow: {
    marginTop: 20,
  },
  tapToFlipHint: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 24,
    fontWeight: "600",
  },
  backScrollContent: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  backCharacter: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.text.white,
  },
  backPinyin: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  backTranslation: {
    fontSize: 16,
    color: Colors.text.white,
    marginTop: 6,
    fontWeight: "800",
    textAlign: "center",
  },
  tagBadge: {
    backgroundColor: Colors.duolingo.blueDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.md,
    marginTop: 10,
  },
  tagText: {
    fontSize: 12,
    color: Colors.duolingo.blue,
    fontWeight: "700",
  },
  radicalBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.duolingo.purpleDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
    marginTop: 8,
  },
  radicalText: {
    fontSize: 12,
    color: Colors.duolingo.purple,
    fontWeight: "600",
  },
  exampleContainer: {
    width: "100%",
    backgroundColor: Colors.duolingo.bgSoftDark,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: 14,
    alignItems: "center",
  },
  exampleHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  exampleCn: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text.white,
    textAlign: "center",
  },
  examplePy: {
    fontSize: 12,
    color: Colors.duolingo.blue,
    marginTop: 2,
    textAlign: "center",
  },
  exampleVi: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  nextCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.duolingo.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.full,
    marginTop: 20,
  },
  nextCardBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
