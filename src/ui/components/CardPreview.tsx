import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CardData } from "../../infrastructure/ai/geminiService.js";
import { theme } from "../theme/theme.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";

export interface CardPreviewProps {
  cardData: CardData;
  onRemove: () => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ cardData, onRemove }) => {
  return (
    <DuolingoCard accessibilityLabel={`Xem trước thẻ ${cardData.kanji}`}>
      <View style={styles.header}>
        <View style={styles.content}>
          <Text style={styles.kanji}>{cardData.kanji}</Text>
          <Text style={styles.pinyin}>{cardData.pinyin}</Text>
          <Text style={styles.meaning}>{cardData.meaning}</Text>
          {cardData.exampleSentence && (
            <Text style={styles.example}>"{cardData.exampleSentence}"</Text>
          )}
        </View>

        <Pressable
          onPress={onRemove}
          accessibilityLabel="Xóa thẻ khỏi danh sách tạo"
          style={styles.deleteBtn}
        >
          <Icon name="trash" size={20} color={theme.colors.danger} />
        </Pressable>
      </View>
    </DuolingoCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
  },
  kanji: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  pinyin: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  meaning: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  example: {
    fontSize: theme.fontSize.xs,
    fontStyle: "italic",
    color: theme.colors.textLight,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
});
