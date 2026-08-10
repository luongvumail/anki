import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { useTheme } from "../theme/ThemeContext.js";

export interface DeckPickerProps {
  decks: DeckEntity[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
}

export const DeckPicker: React.FC<DeckPickerProps> = ({ decks, selectedDeckId, onSelectDeck }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>CHỌN BỘ THẺ MỤC TIÊU</Text>
      <View style={styles.pickerList}>
        {decks.length === 0 ? (
          <View style={[styles.emptyPicker, { backgroundColor: theme.colors.cardBg }]}>
            <Text style={[styles.emptyPickerText, { color: theme.colors.textSecondary }]}>
              Chưa có bộ thẻ nào. Vui lòng tạo bộ thẻ mới!
            </Text>
          </View>
        ) : (
          decks.map((deck) => {
            const isSelected = deck.id === selectedDeckId;
            return (
              <Pressable
                key={deck.id}
                onPress={() => onSelectDeck(deck.id)}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.cardBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: isSelected ? theme.colors.white : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {deck.title} ({deck.cardCount} từ)
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  pickerList: {
    gap: 6,
  },
  optionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyPicker: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyPickerText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
