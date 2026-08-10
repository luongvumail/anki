import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { theme } from "../theme/theme.js";

export interface DeckPickerProps {
  decks: DeckEntity[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
}

export const DeckPicker: React.FC<DeckPickerProps> = ({
  decks,
  selectedDeckId,
  onSelectDeck,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>CHỌN BỘ THẺ MỤC TIÊU</Text>
      <View style={styles.pickerList}>
        {decks.map((deck) => {
          const isSelected = deck.id === selectedDeckId;
          return (
            <Pressable
              key={deck.id}
              onPress={() => onSelectDeck(deck.id)}
              style={[
                styles.optionBtn,
                isSelected && styles.optionBtnSelected,
              ]}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {deck.title} ({deck.cardCount} từ)
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  pickerList: {
    gap: theme.spacing.xs,
  },
  optionBtn: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.cardBg,
  },
  optionBtnSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bg,
  },
  optionText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  optionTextSelected: {
    color: theme.colors.primary,
  },
});
