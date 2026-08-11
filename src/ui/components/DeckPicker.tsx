import React, { useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { useTheme } from "../theme/ThemeContext.js";
import { Icon } from "./Icon.js";

export interface DeckPickerProps {
  decks: DeckEntity[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  label?: string;
}

export const DeckPicker: React.FC<DeckPickerProps> = ({
  decks,
  selectedDeckId,
  onSelectDeck,
  label = "BỘ THẺ MỤC TIÊU",
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>}

      {decks.length === 0 ? (
        <View style={[styles.selectBox, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.selectText, { color: theme.colors.textSecondary }]}>
            Chưa có bộ thẻ nào
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={() => setIsOpen(true)}
          style={[
            styles.selectBox,
            {
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
            },
          ]}
          accessibilityLabel={`Chọn bộ thẻ: ${selectedDeck?.title || "Chọn bộ thẻ"}`}
        >
          <View style={styles.selectContent}>
            <Icon name="book" size={20} color={theme.colors.primary} />
            <Text style={[styles.selectText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {selectedDeck ? `${selectedDeck.title} (${selectedDeck.cardCount} từ)` : "Chọn bộ thẻ"}
            </Text>
          </View>
          <Icon name="arrow-down" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      )}

      {/* Select Dropdown Modal */}
      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
            <View style={[styles.dropdownMenu, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }]}>
              <View style={styles.menuHeader}>
                <Text style={[styles.menuTitle, { color: theme.colors.textPrimary }]}>
                  CHỌN BỘ THẺ
                </Text>
                <Pressable onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                  <Icon name="close" size={20} color={theme.colors.textPrimary} />
                </Pressable>
              </View>

              <ScrollView style={styles.menuList}>
                {decks.map((deck) => {
                  const isSelected = deck.id === selectedDeckId;
                  return (
                    <Pressable
                      key={deck.id}
                      onPress={() => {
                        onSelectDeck(deck.id);
                        setIsOpen(false);
                      }}
                      style={[
                        styles.menuItem,
                        isSelected && { backgroundColor: theme.badges.learned.bg },
                      ]}
                    >
                      <View style={styles.menuItemLeft}>
                        <Icon
                          name="book"
                          size={18}
                          color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.menuItemTitle,
                            { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                          ]}
                        >
                          {deck.title}
                        </Text>
                      </View>
                      <Text style={[styles.menuItemCount, { color: theme.colors.textSecondary }]}>
                        {deck.cardCount} từ
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  selectContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  selectText: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownMenu: {
    width: "100%",
    maxWidth: 360,
    maxHeight: 400,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
  },
  menuList: {
    maxHeight: 300,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  menuItemCount: {
    fontSize: 12,
    fontWeight: "600",
  },
});
