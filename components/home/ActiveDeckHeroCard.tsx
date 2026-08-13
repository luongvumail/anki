import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Radii, Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { Deck } from "../../store/slices/types";
import { AppButton } from "../ui/AppButton";

interface ActiveDeckHeroCardProps {
  deck: Deck;
  dueCount: number;
  learnedCount: number;
  newCount: number;
  onStartStudy: () => void;
  onChangeDeck: () => void;
}

export function ActiveDeckHeroCard({
  deck,
  dueCount,
  learnedCount,
  newCount,
  onStartStudy,
  onChangeDeck,
}: ActiveDeckHeroCardProps) {
  const totalCards = deck.cardCount || dueCount + learnedCount + newCount || 0;
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          borderBottomColor: theme.cardBottom,
        },
      ]}
    >
      {/* Top Header Row: Deck Info & Change Deck Button */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.deckTitleBtn} onPress={onChangeDeck} activeOpacity={0.8}>
          <View style={styles.titleTextGroup}>
            <Text style={[styles.deckLabel, { color: theme.textMuted }]}>BỘ THẺ ĐANG HỌC</Text>
            <View style={styles.nameRow}>
              <Text style={[styles.deckNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                {deck.name}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchBadge,
            { backgroundColor: theme.bgSoft, borderBottomColor: theme.cardBottom },
          ]}
          onPress={onChangeDeck}
          activeOpacity={0.8}
        >
          <Text style={[styles.switchBadgeText, { color: theme.textPrimary }]}>Đổi bộ</Text>
        </TouchableOpacity>
      </View>

      {/* FSRS Stats Row: Due, Learned, New */}
      <View style={styles.statsGrid}>
        {/* DUE COUNT (RED) */}
        <View
          style={[styles.statBox, { backgroundColor: theme.bgSoft, borderLeftColor: theme.red }]}
        >
          <View>
            <Text style={[styles.statValueText, { color: theme.red }]}>{dueCount}</Text>
            <Text style={[styles.statLabelText, { color: theme.textMuted }]}>Cần ôn</Text>
          </View>
        </View>

        {/* LEARNED COUNT (GREEN) */}
        <View
          style={[styles.statBox, { backgroundColor: theme.bgSoft, borderLeftColor: theme.green }]}
        >
          <View>
            <Text style={[styles.statValueText, { color: theme.green }]}>{learnedCount}</Text>
            <Text style={[styles.statLabelText, { color: theme.textMuted }]}>Đã thuộc</Text>
          </View>
        </View>

        {/* NEW COUNT (BLUE) */}
        <View
          style={[styles.statBox, { backgroundColor: theme.bgSoft, borderLeftColor: theme.blue }]}
        >
          <View>
            <Text style={[styles.statValueText, { color: theme.blue }]}>{newCount}</Text>
            <Text style={[styles.statLabelText, { color: theme.textMuted }]}>Từ mới</Text>
          </View>
        </View>
      </View>

      {/* Main Start Action Button */}
      <AppButton
        title={
          dueCount > 0
            ? `ÔN TẬP NGAY (${dueCount} TỪ CẦN ÔN)`
            : totalCards > 0
              ? "BẮT ĐẦU HỌC BÀI KẾ TIẾP"
              : "THÊM TỪ VỰNG VÀO BỘ"
        }
        variant="primary"
        size="lg"
        onPress={onStartStudy}
        style={{ marginTop: Spacing.xs }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: Radii.xl,
    borderWidth: 0,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  deckTitleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  titleTextGroup: {
    flex: 1,
  },
  deckLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deckNameText: {
    fontSize: 18,
    fontWeight: "800",
    flexShrink: 1,
  },
  switchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 0,
  },
  switchBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radii.lg,
    borderLeftWidth: 3,
  },
  statValueText: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabelText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
