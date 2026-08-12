import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radii, Spacing } from "../../constants/theme";
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
                    ? Colors.duolingo.yellow
                    : Colors.duolingo.blue,
                },
              ]}
            >
              <Text style={styles.dueBadgeText}>{dueCount}</Text>
            </Animated.View>
          ) : isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />
            </View>
          ) : null}

          {/* Duolingo 3D Button Node */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onSelect(deck)}
            style={[
              styles.nodeButton,
              isPriority && styles.nodeButtonPriority,
              isCompleted && styles.nodeButtonCompleted,
            ]}
          >
            <View style={styles.nodeInnerCircle}>
              {isCompleted ? (
                <Ionicons name="star" size={28} color={Colors.duolingo.yellow} />
              ) : (
                <DeckIcon
                  name={deck.icon}
                  size={26}
                  color={isPriority ? Colors.duolingo.blue : Colors.duolingo.textMuted}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Deck Title Card Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelect(deck)}
          style={[styles.nodeTextCard, isPriority && styles.nodeTextCardPriority]}
        >
          <Text style={styles.nodeDeckName} numberOfLines={1}>
            {deck.name}
          </Text>
          <Text style={styles.nodeDeckSub}>
            {deck.cardCount || 0} từ · {dueCount > 0 ? `Cần ôn ${dueCount}` : "Đã xong"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);

export function ZigZagSkillPath({ decks, dueCardsMap, onSelectDeck }: ZigZagSkillPathProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      <View style={styles.unitBanner}>
        <View style={styles.unitBannerContent}>
          <Text style={styles.unitBannerTitle}>KHO BỘ THẺ CỦA TÔI</Text>
          <Text style={styles.unitBannerSub}>
            Chọn bộ thẻ bên dưới để bắt đầu lật thẻ Flashcard &amp; làm bài tập SRS!
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
    backgroundColor: Colors.duolingo.blue,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: Colors.duolingo.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  unitBannerContent: {
    gap: 4,
  },
  unitBannerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  unitBannerSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    lineHeight: 16,
  },
  pathList: {
    alignItems: "center",
    gap: 28,
    width: "100%",
  },
  mascotPathContainer: {
    marginBottom: -10,
    zIndex: 10,
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  nodeWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  dueBadge: {
    position: "absolute",
    top: -12,
    zIndex: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  completedBadge: {
    position: "absolute",
    top: -8,
    zIndex: 5,
    backgroundColor: Colors.duolingo.green,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  nodeButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.duolingo.cardBottom,
    paddingBottom: 6,
    justifyContent: "flex-start",
  },
  nodeButtonPriority: {
    backgroundColor: Colors.duolingo.blue,
  },
  nodeButtonCompleted: {
    backgroundColor: Colors.duolingo.green,
  },
  nodeInnerCircle: {
    width: "100%",
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.duolingo.cardBg,
    borderWidth: 3,
    borderColor: Colors.duolingo.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeTextCard: {
    backgroundColor: Colors.duolingo.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    maxWidth: 160,
  },
  nodeTextCardPriority: {
    borderColor: Colors.duolingo.blue,
  },
  nodeDeckName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text.white,
  },
  nodeDeckSub: {
    fontSize: 11,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
});
