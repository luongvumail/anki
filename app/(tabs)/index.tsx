import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../src/infrastructure/firebase/firebaseApp";
import { useAppStore } from "../../src/ui/store/useAppStore";
import { Colors, Spacing } from "../../constants/theme";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { ZigZagSkillPath } from "../../components/home/ZigZagSkillPath";
import { FloatingAddButton } from "../../components/ui/FloatingAddButton";
import { AIAddCardModal } from "../../components/add/AIAddCardModal";
import { computeDueCount } from "../../src/domain/card/cardUtils";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const decks = useAppStore((s) => s.decks);
  const fetchDecks = useAppStore((s) => s.fetchDecks);
  const loadReviewHistory = useAppStore((s) => s.loadReviewHistory);
  const streakCount = useAppStore((s) => s.streakCount);
  const isDeckLoading = useAppStore((s) => s.isDeckLoading);
  const cardsState = useAppStore((s) => s.cards);
  const [refreshing, setRefreshing] = useState(false);

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
      loadReviewHistory();
    }, [loadReviewHistory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar with Personalized User Greeting */}
      <DuolingoHeader streakCount={streakCount} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.duolingo.green}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isDeckLoading && decks.length === 0 ? (
          <ActivityIndicator
            size="small"
            color={Colors.duolingo.green}
            style={{ marginVertical: 40 }}
          />
        ) : decks.length === 0 ? (
          <DuolingoCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có bộ thẻ nào!</Text>
            <Text style={styles.emptySub}>Hãy tạo bộ thẻ mới hoặc dùng AI để nạp từ vựng.</Text>
            <DuolingoButton
              title="TẠO BỘ THẺ MỚI"
              icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
              variant="primary"
              onPress={() => router.push("/(tabs)/decks")}
              style={{ marginTop: Spacing.md }}
            />
          </DuolingoCard>
        ) : (
          /* REAL DECKS ZIGZAG SKILL PATH (1 NODE = 1 DECK) */
          <ZigZagSkillPath
            decks={decks}
            dueCardsMap={dueCardsMap}
            onSelectDeck={(deck) => {
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
        <AIAddCardModal
          visible={showAIAddModal}
          onClose={() => setShowAIAddModal(false)}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
  },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptySub: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
});
