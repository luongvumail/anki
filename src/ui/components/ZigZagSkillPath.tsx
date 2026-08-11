import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { useTheme } from "../theme/ThemeContext.js";
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
  const { theme } = useTheme();
  const offsets = [0, 36, 54, 24, -24, -54, -36];

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={[styles.banner, { backgroundColor: theme.colors.cardBg }]}>
        <Text style={[styles.bannerTitle, { color: theme.colors.textPrimary }]}>
          KHO BỘ THẺ TIẾNG TRUNG
        </Text>
        <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
          Chọn bộ thẻ bên dưới để bắt đầu lật thẻ Flashcard & làm bài tập SRS!
        </Text>
      </View>

      {/* ZigZag Nodes */}
      {decks.map((deck, idx) => {
        const offset = offsets[idx % offsets.length];
        const isPriority = Boolean(urgentDeckId && deck.id === urgentDeckId && deck.cardCount > 0);

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
              style={[styles.circleNode, { backgroundColor: deck.color || theme.colors.primary }]}
            >
              <Icon name="book" size={32} color="#FFFFFF" />
            </View>

            {/* Label */}
            <Text style={[styles.nodeTitle, { color: theme.colors.textPrimary }]}>
              {deck.title}
            </Text>
            <Text style={[styles.nodeSubtitle, { color: theme.colors.textSecondary }]}>
              {deck.cardCount} từ vựng
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
  },
  banner: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
  },
  nodeWrapper: {
    marginVertical: 12,
    alignItems: "center",
  },
  badgeWrapper: {
    marginBottom: 6,
  },
  circleNode: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderBottomWidth: 5,
    borderBottomColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
  },
  nodeSubtitle: {
    fontSize: 12,
  },
});
