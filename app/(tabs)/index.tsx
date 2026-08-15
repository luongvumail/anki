import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getStreakCount } from "../../lib/reviewTracker";
import { useStore } from "../../store/useStore";
import { Spacing, Typography, Layout } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { AppHeader } from "../../components/ui/AppHeader";
import { AppMascot } from "../../components/ui/AppMascot";
import { ZigZagSkillPath } from "../../components/home/ZigZagSkillPath";
import { FloatingAddButton } from "../../components/ui/FloatingAddButton";
import { AIAddCardModal } from "../../components/add/AIAddCardModal";
import { LoadingIndicator } from "../../components/ui/LoadingIndicator";
import { Deck } from "../../store/slices/types";
import { computeDueCount } from "../../lib/deckUtils";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const decks = useStore((s) => s.decks);
  const fetchDecks = useStore((s) => s.fetchDecks);
  const isLoading = useStore((s) => s.isLoading);
  const cardsState = useStore((s) => s.cards);
  const [refreshing, setRefreshing] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const [showAIAddModal, setShowAIAddModal] = useState(false);

  // Calculate due cards map for all decks
  const dueCardsMap = useMemo(() => {
    const map: Record<string, number> = {};
    decks.forEach((d) => {
      const deckCards = cardsState[d.id] || [];
      map[d.id] = deckCards.length > 0 ? computeDueCount(deckCards) : d.dueCount || 0;
    });
    return map;
  }, [decks, cardsState]);

  useFocusEffect(
    useCallback(() => {
      getStreakCount().then(setStreakCount);
      fetchDecks();
    }, [fetchDecks]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header Bar with Personalized User Greeting */}
      <AppHeader streakCount={streakCount} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.green} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && decks.length === 0 ? (
          <LoadingIndicator message="Đang nạp lộ trình học..." />
        ) : decks.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <AppMascot expression="waving" size={80} speechBubbleText="Sẵn sàng học Tiếng Trung?" />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              Chưa có bộ thẻ nào!
            </Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Hãy tạo bộ thẻ mới hoặc dùng AI để nạp từ vựng và bắt đầu lộ trình FSRS.
            </Text>
            <AppButton
              title="TẠO BỘ THẺ MỚI"
              icon={<Ionicons name="add-circle" size={Layout.iconMd} color="#FFFFFF" />}
              variant="primary"
              size="lg"
              onPress={() => router.push("/(tabs)/decks")}
              style={{ marginTop: Spacing.lg }}
            />
          </AppCard>
        ) : (
          /* REAL DECKS ZIGZAG SKILL PATH (1 NODE = 1 DECK) */
          <ZigZagSkillPath
            decks={decks}
            dueCardsMap={dueCardsMap}
            onSelectDeck={(deck: Deck) => {
              const due = dueCardsMap[deck.id] || 0;
              if (due > 0) {
                router.push(`/study/${deck.id}`);
              } else {
                router.push(`/deck/${deck.id}`);
              }
            }}
          />
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) to AI Add Cards */}
      <FloatingAddButton onPress={() => setShowAIAddModal(true)} />

      {/* AI Add Card Full Overlay Modal */}
      {showAIAddModal && (
        <AIAddCardModal visible={showAIAddModal} onClose={() => setShowAIAddModal(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    marginTop: 0,
  },
  emptyTitle: {
    fontSize: Typography.title3.fontSize,
    fontWeight: Typography.weight.extraBold,
    marginTop: Spacing.xs,
  },
  emptySub: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
