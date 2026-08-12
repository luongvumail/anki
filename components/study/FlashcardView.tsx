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
import { Spacing, Radii, Typography, BorderWidths } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
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
  const { theme } = useTheme();
  const cardWidth = width - Spacing.pageMargin * 2;

  const {
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
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardFront,
            frontAnimatedStyle,
            {
              width: cardWidth,
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              borderBottomColor: theme.cardBottom,
            },
          ]}
        >
          <Text style={[styles.frontCharacter, { color: theme.textPrimary }]}>{card.character}</Text>

          <View style={styles.audioRow}>
            <AudioButton onPress={playTTS} isPlaying={speaking} size="md" />
          </View>

          <Text style={[styles.tapToFlipHint, { color: theme.textMuted }]}>Chạm vào thẻ để xem nghĩa & chi tiết</Text>
        </Animated.View>

        {/* Back Face */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            backAnimatedStyle,
            {
              width: cardWidth,
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              borderBottomColor: theme.cardBottom,
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.backScrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.backCharacter, { color: theme.textPrimary }]}>{card.character}</Text>
            <Text
              style={[
                styles.backPinyin,
                { color: getPinyinToneColor(card.pinyin) },
              ]}
            >
              {card.pinyin}
            </Text>
            <Text style={[styles.backTranslation, { color: theme.textPrimary }]}>{card.translation}</Text>

            {card.hanviet ? (
              <View style={[styles.tagBadge, { backgroundColor: theme.blueDim }]}>
                <Text style={[styles.tagText, { color: theme.blue }]}>Hán Việt: {card.hanviet}</Text>
              </View>
            ) : null}

            {card.radical ? (
              <View style={[styles.radicalBox, { backgroundColor: theme.purpleDim }]}>
                <Ionicons name="shapes" size={14} color={theme.purple} />
                <Text style={[styles.radicalText, { color: theme.purple }]}>Bộ thủ: {card.radical}</Text>
              </View>
            ) : null}

            {card.examples && card.examples.length > 0 ? (
              <View style={[styles.exampleContainer, { backgroundColor: theme.bgSoft }]}>
                <Text style={[styles.exampleHeader, { color: theme.textMuted }]}>CÂU VÍ DỤ</Text>
                <Text style={[styles.exampleCn, { color: theme.textPrimary }]}>{card.examples[0].chinese}</Text>
                {card.examples[0].pinyin ? <Text style={[styles.examplePy, { color: theme.blue }]}>{card.examples[0].pinyin}</Text> : null}
                {card.examples[0].vietnamese ? <Text style={[styles.exampleVi, { color: theme.textMuted }]}>{card.examples[0].vietnamese}</Text> : null}
              </View>
            ) : null}

            {showNextButton && onNext ? (
              <TouchableOpacity style={[styles.nextCardBtn, { backgroundColor: theme.green }]} onPress={onNext}>
                <Text style={styles.nextCardBtnText}>TIẾP THEO</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.pageMargin,
  },
  cardWrapper: {
    width: "100%",
    height: 440,
  },
  cardFace: {
    width: "100%",
    height: "100%",
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    borderWidth: BorderWidths.thin,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    zIndex: 1,
  },
  frontCharacter: {
    fontSize: Typography.hanziHero.fontSize,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
  },
  audioRow: {
    marginTop: Spacing.md,
  },
  tapToFlipHint: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.xl,
    fontWeight: Typography.weight.semibold,
  },
  backScrollContent: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  backCharacter: {
    fontSize: Typography.hanziCard.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  backPinyin: {
    fontSize: Typography.title3.fontSize,
    fontWeight: Typography.weight.bold,
    marginTop: Spacing.xs,
  },
  backTranslation: {
    fontSize: Typography.callout.fontSize,
    marginTop: Spacing.sm,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
  },
  tagBadge: {
    paddingHorizontal: Spacing.cellPadding,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    marginTop: Spacing.cellPadding,
  },
  tagText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.bold,
  },
  radicalBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
  },
  radicalText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.semibold,
  },
  exampleContainer: {
    width: "100%",
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.cellPadding,
    alignItems: "center",
  },
  exampleHeader: {
    fontSize: Typography.text.caption2.fontSize,
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  exampleCn: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
  },
  examplePy: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
    textAlign: "center",
  },
  exampleVi: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
    textAlign: "center",
  },
  nextCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radii.full,
    marginTop: Spacing.lg,
  },
  nextCardBtnText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
  },
});
