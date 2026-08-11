import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing } from "../../constants/theme";
import { DeckIcon } from "../ui/DeckIcon";
import { DuolingoCard } from "../ui/DuolingoCard";
import { DuolingoButton } from "../ui/DuolingoButton";
import { ProgressBar } from "../ui/ProgressBar";
import { Deck } from "../../store/slices/types";

interface DeckCardItemProps {
  itemStats: {
    deck: Deck;
    total: number;
    due: number;
    newCount: number;
    reviewCount: number;
    masteryPct: number;
  };
  onDelete: (deckId: string, name: string) => void;
}

export const DeckCardItem = React.memo(({ itemStats, onDelete }: DeckCardItemProps) => {
  const { deck, total, due, masteryPct } = itemStats;

  return (
    <DuolingoCard style={styles.deckCardItem} onPress={() => router.push(`/deck/${deck.id}`)}>
      <View style={styles.deckHeaderRow}>
        <View style={styles.deckIconBox}>
          <DeckIcon name={deck.icon || "book-outline"} size={22} color={Colors.duolingo.blue} />
        </View>

        <View style={styles.deckMainTitleBox}>
          <View style={styles.titleChevronRow}>
            <Text style={styles.deckTitle} numberOfLines={1}>
              {deck.name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.duolingo.textMuted} />
          </View>
          <Text style={styles.deckCardCountText}>
            {total} từ vựng {due > 0 ? ` · ${due} thẻ cần ôn` : ""}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(deck.id, deck.name)}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.duolingo.red} />
        </TouchableOpacity>
      </View>

      {deck.description ? (
        <Text style={styles.deckDesc} numberOfLines={2}>
          {deck.description}
        </Text>
      ) : null}

      <View style={styles.masteryBarRow}>
        <ProgressBar
          progress={masteryPct / 100}
          height={10}
          fillColor={Colors.duolingo.green}
          style={{ flex: 1 }}
        />
        <Text style={styles.masteryPctText}>{masteryPct}% Thuộc</Text>
      </View>

      <DuolingoButton
        title={due > 0 ? `HỌC BÀI NGAY (${due} THẺ DỰ ĐỊNH)` : "XEM DANH SÁCH TỪ VỰNG"}
        variant={due > 0 ? "primary" : "secondary"}
        size="lg"
        onPress={() => {
          if (due > 0) {
            router.push(`/study/${deck.id}`);
          } else {
            router.push(`/deck/${deck.id}`);
          }
        }}
        style={{ marginTop: Spacing.md }}
      />
    </DuolingoCard>
  );
});

const styles = StyleSheet.create({
  deckCardItem: { padding: Spacing.md, marginBottom: 14 },
  deckHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  deckIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.duolingo.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },
  deckMainTitleBox: { flex: 1 },
  titleChevronRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deckTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", flexShrink: 1 },
  deckCardCountText: { fontSize: 13, color: Colors.duolingo.textMuted, marginTop: 2, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  deckDesc: { fontSize: 13, color: "rgba(255, 255, 255, 0.75)", marginTop: 6, lineHeight: 17 },
  masteryBarRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  masteryPctText: { fontSize: 12, fontWeight: "800", color: Colors.duolingo.green },
});
