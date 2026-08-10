import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { theme } from "../theme/theme.js";
import { Icon } from "./Icon.js";
import { StatusBadge } from "./StatusBadge.js";

export interface ZigZagSkillPathProps {
  decks: DeckEntity[];
  urgentDeckId?: string | null;
  onSelectDeck: (deckId: string) => void;
}

export const ZigZagSkillPath: React.FC<ZigZagSkillPathProps> = ({
  decks,
  urgentDeckId,
  onSelectDeck,
}) => {
  const offsets = [0, 40, 60, 30, -30, -60, -40];

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>KHO BỘ THẺ TIẾNG TRUNG</Text>
        <Text style={styles.bannerSubtitle}>
          Chọn bộ thẻ bên dưới để bắt đầu lật thẻ Flashcard & làm bài tập SRS!
        </Text>
      </View>

      {/* ZigZag Nodes */}
      {decks.map((deck, idx) => {
        const offset = offsets[idx % offsets.length];
        const isPriority = urgentDeckId ? deck.id === urgentDeckId : idx === 0;

        return (
          <Pressable
            key={deck.id}
            onPress={() => onSelectDeck(deck.id)}
            style={({ pressed }) => [
              styles.nodeWrapper,
              {
                transform: [{ translateX: offset }, { scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            {/* Priority Badge */}
            {isPriority && (
              <View style={styles.badgeWrapper}>
                <StatusBadge variant="due" label="CẦN ÔN NGAY" size="sm" />
              </View>
            )}

            {/* Circular Node Button */}
            <View
              style={[
                styles.circleNode,
                { backgroundColor: deck.color || theme.colors.primary },
              ]}
            >
              <Icon name="book" size={32} color={theme.colors.white} />
            </View>

            {/* Label */}
            <Text style={styles.nodeTitle}>{deck.title}</Text>
            <Text style={styles.nodeSubtitle}>{deck.cardCount} từ vựng</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  banner: {
    width: "100%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.xl,
  },
  bannerTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  bannerSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  nodeWrapper: {
    marginVertical: theme.spacing.md,
    alignItems: "center",
  },
  badgeWrapper: {
    marginBottom: theme.spacing.xs,
  },
  circleNode: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderBottomWidth: 6,
    borderBottomColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  nodeTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  nodeSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
