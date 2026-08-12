import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radii, Spacing, Typography, Layout, BorderWidths } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { Deck } from "../../store/slices/types";
import { DeckIcon } from "../ui/DeckIcon";
import { DuolingoMascot } from "../ui/DuolingoMascot";

interface ZigZagSkillPathProps {
  decks: Deck[];
  dueCardsMap: Record<string, number>;
  onSelectDeck: (deck: Deck) => void;
}

interface PathNodeItemProps {
  deck: Deck;
  offset: number;
  dueCount: number;
  isPriority: boolean;
  isCompleted: boolean;
  pulseAnim: Animated.Value;
  onSelect: (deck: Deck) => void;
}

const PathNodeItem = React.memo(
  ({
    deck,
    offset,
    dueCount,
    isPriority,
    isCompleted,
    pulseAnim,
    onSelect,
  }: PathNodeItemProps) => {
    const { theme } = useTheme();

    return (
      <View style={[styles.nodeRow, { transform: [{ translateX: offset }] }]}>
        <View style={styles.nodeWrapper}>
          {/* Floating Due Count Badge */}
          {dueCount > 0 ? (
            <Animated.View
              style={[
                styles.dueBadge,
                {
                  transform: isPriority ? [{ scale: pulseAnim }] : [],
                  backgroundColor: isPriority
                    ? theme.yellow
                    : theme.blue,
                },
              ]}
            >
              <Text style={styles.dueBadgeText}>{dueCount}</Text>
            </Animated.View>
          ) : isCompleted ? (
            <View style={[styles.completedBadge, { backgroundColor: theme.green }]}>
              <Ionicons name="checkmark-sharp" size={Layout.iconSm} color="#FFFFFF" />
            </View>
          ) : null}

          {/* Duolingo 3D Button Node */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onSelect(deck)}
            style={[
              styles.nodeButton,
              { backgroundColor: theme.cardBottom },
              isPriority && { backgroundColor: theme.blue },
              isCompleted && { backgroundColor: theme.green },
            ]}
          >
            <View style={[styles.nodeInnerCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              {isCompleted ? (
                <Ionicons name="star" size={Layout.iconXl} color={theme.yellow} />
              ) : (
                <DeckIcon
                  name={deck.icon}
                  size={Layout.iconLg}
                  color={isPriority ? theme.blue : theme.textMuted}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Deck Title Card Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelect(deck)}
          style={[
            styles.nodeTextCard,
            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            isPriority && { borderColor: theme.blue },
          ]}
        >
          <Text style={[styles.nodeDeckName, { color: theme.textPrimary }]} numberOfLines={1}>
            {deck.name}
          </Text>
          <Text style={[styles.nodeDeckSub, { color: theme.textMuted }]}>
            {deck.cardCount || 0} từ · {dueCount > 0 ? `Cần ôn ${dueCount}` : "Đã xong"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);

export function ZigZagSkillPath({ decks, dueCardsMap, onSelectDeck }: ZigZagSkillPathProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  if (!decks || decks.length === 0) return null;

  const offsets = [0, 50, 70, 40, -40, -70, -50];

  let priorityIdx = 0;
  let maxDue = -1;
  decks.forEach((deck, idx) => {
    const due = dueCardsMap[deck.id] || deck.dueCount || 0;
    if (due > maxDue) {
      maxDue = due;
      priorityIdx = idx;
    }
  });

  return (
    <View style={styles.container}>
      {/* Unit Title Banner */}
      <View style={[styles.unitBanner, { backgroundColor: theme.blue, shadowColor: theme.blue }]}>
        <View style={styles.unitBannerContent}>
          <Text style={styles.unitBannerTitle}>KHO BỘ THẺ CỦA TÔI</Text>
          <Text style={styles.unitBannerSub}>
            Chọn bộ thẻ bên dưới để bắt đầu lật thẻ Flashcard & làm bài tập SRS!
          </Text>
        </View>
      </View>

      {/* Real Decks Zig-Zag Path */}
      <View style={styles.pathList}>
        {decks.map((deck, idx) => {
          const offset = offsets[idx % offsets.length];
          const dueCount = dueCardsMap[deck.id] || deck.dueCount || 0;
          const isPriority = idx === priorityIdx;
          const isCompleted = dueCount === 0 && (deck.cardCount || 0) > 0;

          return (
            <React.Fragment key={deck.id}>
              {/* Mascot Panda standing by the priority deck */}
              {isPriority && (
                <View
                  style={[
                    styles.mascotPathContainer,
                    { transform: [{ translateX: -offset * 0.8 }] },
                  ]}
                >
                  <DuolingoMascot
                    expression={dueCount > 0 ? "happy" : "celebrate"}
                    size={64}
                    speechBubbleText={
                      dueCount > 0
                        ? `Bộ "${deck.name}" có ${dueCount} từ cần ôn!`
                        : `Bộ "${deck.name}" đã thuộc hết hôm nay!`
                    }
                  />
                </View>
              )}

              <PathNodeItem
                deck={deck}
                offset={offset}
                dueCount={dueCount}
                isPriority={isPriority}
                isCompleted={isCompleted}
                pulseAnim={pulseAnim}
                onSelect={onSelectDeck}
              />
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  unitBanner: {
    width: "100%",
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  unitBannerContent: {
    gap: Spacing.xs,
  },
  unitBannerTitle: {
    fontSize: Typography.callout.fontSize,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  unitBannerSub: {
    fontSize: Typography.caption1.fontSize,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: Typography.weight.semibold,
    lineHeight: 16,
  },
  pathList: {
    alignItems: "center",
    gap: Spacing.xxl,
    width: "100%",
  },
  mascotPathContainer: {
    marginBottom: -Spacing.sm,
    zIndex: 10,
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.cellPadding,
  },
  nodeWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  dueBadge: {
    position: "absolute",
    top: -Spacing.md,
    zIndex: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radii.full,
    borderWidth: BorderWidths.default,
    borderColor: "#FFFFFF",
  },
  dueBadgeText: {
    fontSize: Typography.caption2.fontSize,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
  },
  completedBadge: {
    position: "absolute",
    top: -Spacing.sm,
    zIndex: 5,
    width: Layout.iconMd,
    height: Layout.iconMd,
    borderRadius: Layout.iconMd / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: BorderWidths.default,
    borderColor: "#FFFFFF",
  },
  nodeButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    paddingBottom: 6,
    justifyContent: "flex-start",
  },
  nodeInnerCircle: {
    width: "100%",
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeTextCard: {
    paddingHorizontal: Spacing.cellPadding,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: BorderWidths.default,
    maxWidth: 160,
  },
  nodeDeckName: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  nodeDeckSub: {
    fontSize: Typography.caption2.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
  },
});
