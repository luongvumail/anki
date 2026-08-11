import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useStore } from "../../store/useStore";
import { getFirestoreErrorMessage } from "../../lib/errorHandler";
import { Colors, Spacing, Radii, VECTOR_DECK_ICONS, triggerHaptic } from "../../constants/theme";
import { DeckIcon } from "../../components/ui/DeckIcon";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { FormField } from "../../components/ui/FormField";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { FloatingAddButton } from "../../components/ui/FloatingAddButton";
import { AIAddCardModal } from "../../components/add/AIAddCardModal";
import { DeckCardItem } from "../../components/deck/DeckCardItem";
import { SkeletonCard } from "../../components/ui/SkeletonCard";
import { getStreakCount } from "../../lib/reviewTracker";
import {
  computeDueCount,
  computeNewCount,
  computeReviewDueCount,
  getDeckMasteryPct,
} from "../../lib/deckUtils";

export default function DecksScreen() {
  const insets = useSafeAreaInsets();
  const decks = useStore((s) => s.decks);
  const cardsState = useStore((s) => s.cards);
  const fetchDecks = useStore((s) => s.fetchDecks);
  const createDeck = useStore((s) => s.createDeck);
  const deleteDeck = useStore((s) => s.deleteDeck);
  const isLoading = useStore((s) => s.isLoading);
  const userId = useStore((s) => s.userId);

  const [streakCount, setStreakCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showAIAddModal, setShowAIAddModal] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(VECTOR_DECK_ICONS[0]);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getStreakCount().then(setStreakCount);
    }, [])
  );

  const deckItemsStats = useMemo(() => {
    return decks.map((deck) => {
      const deckCards = cardsState[deck.id];
      const total = deckCards ? deckCards.length : deck.cardCount || 0;
      const due = deckCards ? computeDueCount(deckCards) : deck.dueCount || 0;
      const newCount = deckCards ? computeNewCount(deckCards) : deck.newCount || 0;
      const reviewCount = deckCards
        ? computeReviewDueCount(deckCards)
        : Math.max(0, due - newCount);
      const masteryPct = getDeckMasteryPct(total, due, deckCards);
      return { deck, total, due, newCount, reviewCount, masteryPct };
    });
  }, [decks, cardsState]);

  useEffect(() => {
    if (userId && decks.length === 0) fetchDecks();
  }, [userId, decks.length, fetchDecks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  }, [fetchDecks]);

  const handleCreate = useCallback(async () => {
    if (!deckName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên bộ thẻ");
      return;
    }
    setCreating(true);
    try {
      await createDeck({
        name: deckName.trim(),
        description: deckDesc.trim(),
        color: Colors.duolingo.blue,
        icon: selectedIcon,
      });
      setDeckName("");
      setDeckDesc("");
      setShowCreate(false);
    } catch (e: unknown) {
      Alert.alert("Tạo bộ thẻ thất bại", getFirestoreErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }, [createDeck, deckDesc, deckName, selectedIcon]);

  const handleDelete = useCallback(
    (deckId: string, name: string) => {
      Alert.alert(
        "Xóa bộ thẻ",
        `Bạn có chắc chắn muốn xóa bộ thẻ "${name}" cùng toàn bộ thẻ từ vựng bên trong không?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa bộ thẻ",
            style: "destructive",
            onPress: async () => {
              triggerHaptic("heavy");
              try {
                await deleteDeck(deckId);
              } catch (e: unknown) {
                Alert.alert("Xóa thất bại", getFirestoreErrorMessage(e));
              }
            },
          },
        ]
      );
    },
    [deleteDeck]
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.screenHeaderRow}>
        <View style={styles.screenHeaderTitleBox}>
          <Text style={styles.screenTitle}>BỘ THẺ TỪ VỰNG</Text>
          <Text style={styles.screenSubtitle}>
            {decks.length} bộ thẻ
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addDeckHeaderBtn}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addDeckHeaderBtnText}>TẠO BỘ THẺ</Text>
        </TouchableOpacity>
      </View>
    ),
    [decks.length]
  );

  const renderEmpty = useCallback(
    () =>
      isLoading ? (
        <View style={{ marginTop: Spacing.md }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </View>
      ) : (
        <DuolingoCard style={styles.emptyCard}>
          <Ionicons name="library-outline" size={48} color={Colors.duolingo.blue} />
          <Text style={styles.emptyTitle}>Chưa có bộ thẻ nào!</Text>
          <Text style={styles.emptySub}>
            Bấm nút "Tạo bộ thẻ" ở trên để bắt đầu khởi tạo danh sách từ vựng.
          </Text>
          <DuolingoButton
            title="TẠO BỘ THẺ ĐẦU TIÊN"
            variant="primary"
            size="lg"
            onPress={() => setShowCreate(true)}
            style={{ marginTop: Spacing.md, width: "100%" }}
          />
        </DuolingoCard>
      ),
    [isLoading]
  );

  const renderDeckItem = useCallback(
    ({ item }: { item: (typeof deckItemsStats)[0] }) => (
      <DeckCardItem itemStats={item} onDelete={handleDelete} />
    ),
    [handleDelete]
  );

  return (
    <View style={styles.container}>
      <DuolingoHeader streakCount={streakCount} />

      <FlatList
        data={deckItemsStats}
        keyExtractor={(item) => item.deck.id}
        renderItem={renderDeckItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.duolingo.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Modal Create Deck - iOS pageSheet modal Presentation */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
            <TouchableOpacity onPress={() => setShowCreate(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color={Colors.duolingo.textMuted} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>TẠO BỘ THẺ MỚI</Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <DuolingoCard style={{ marginBottom: Spacing.md }}>
              <FormField
                label="Tên bộ thẻ"
                value={deckName}
                onChangeText={setDeckName}
                placeholder="Ví dụ: Từ vựng HSK 1, Giao tiếp..."
              />
              <View style={{ height: 12 }} />
              <FormField
                label="Mô tả bộ thẻ"
                value={deckDesc}
                onChangeText={setDeckDesc}
                placeholder="Ví dụ: 150 từ vựng căn bản..."
              />
            </DuolingoCard>

            <SectionTitle>CHỌN BIỂU TƯỢNG BỘ THẺ</SectionTitle>
            <View style={styles.iconGrid}>
              {VECTOR_DECK_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[styles.iconPickerItem, isSelected && styles.iconPickerSelected]}
                    onPress={() => setSelectedIcon(iconName)}
                  >
                    <DeckIcon
                      name={iconName}
                      size={24}
                      color={isSelected ? Colors.duolingo.blue : Colors.duolingo.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <DuolingoButton
              title={creating ? "ĐANG TẠO..." : "TẠO BỘ THẺ"}
              variant="primary"
              size="lg"
              disabled={creating || !deckName.trim()}
              onPress={handleCreate}
              style={{ marginTop: Spacing.lg }}
            />
          </ScrollView>
        </View>
      </Modal>

      <FloatingAddButton onPress={() => setShowAIAddModal(true)} />

      {showAIAddModal && (
        <AIAddCardModal visible={showAIAddModal} onClose={() => setShowAIAddModal(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.duolingo.bg },
  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },
  screenHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  screenHeaderTitleBox: { flex: 1 },
  screenTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },
  screenSubtitle: { fontSize: 13, fontWeight: "600", color: Colors.duolingo.textMuted, marginTop: 2 },
  addDeckHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.duolingo.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderBottomWidth: 3,
    borderBottomColor: Colors.duolingo.blueDark,
  },
  addDeckHeaderBtnText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  emptyCard: { alignItems: "center", justifyContent: "center", padding: Spacing.xl, marginTop: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.duolingo.textMuted, marginTop: 6, textAlign: "center" },
  modalContainer: { flex: 1, backgroundColor: Colors.duolingo.bg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.duolingo.cardBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  modalScroll: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md, paddingBottom: 40 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: Spacing.md },
  iconPickerItem: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.duolingo.bgSoftDark,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#18242B",
  },
  iconPickerSelected: {
    backgroundColor: Colors.duolingo.blueDim,
    borderBottomColor: Colors.duolingo.blueDark,
  },
});
