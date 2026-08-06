import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAppStore } from "../../src/ui/store/useAppStore";
import { getFirestoreErrorMessage } from "../../src/ui/utils/errorHandler";
import { Colors, Spacing, Radii, VECTOR_DECK_ICONS, triggerHaptic } from "../../constants/theme";
import { DeckIcon } from "../../components/ui/DeckIcon";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { FormField } from "../../components/ui/FormField";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { FloatingAddButton } from "../../components/ui/FloatingAddButton";
import { AIAddCardModal } from "../../components/add/AIAddCardModal";
import {
  computeDueCount,
  computeNewCount,
  computeReviewDueCount,
  getDeckMasteryPct,
} from "../../src/domain/card/cardUtils";

export default function DecksScreen() {
  const insets = useSafeAreaInsets();
  const decks = useAppStore((s) => s.decks);
  const cardsState = useAppStore((s) => s.cards);
  const fetchDecks = useAppStore((s) => s.fetchDecks);
  const createDeck = useAppStore((s) => s.createDeck);
  const deleteDeck = useAppStore((s) => s.deleteDeck);
  const isDeckLoading = useAppStore((s) => s.isDeckLoading);
  const loadReviewHistory = useAppStore((s) => s.loadReviewHistory);
  const streakCount = useAppStore((s) => s.streakCount);

  const [showCreate, setShowCreate] = useState(false);
  const [showAIAddModal, setShowAIAddModal] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadReviewHistory();
    }, [loadReviewHistory])
  );

  const [selectedIcon, setSelectedIcon] = useState(VECTOR_DECK_ICONS[0]);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    if (decks.length === 0) fetchDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  };

  const handleCreate = async () => {
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
    } catch (e: any) {
      Alert.alert("Tạo bộ thẻ thất bại", getFirestoreErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (deckId: string, name: string) => {
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
            } catch (e: any) {
              Alert.alert("Xóa thất bại", getFirestoreErrorMessage(e));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <DuolingoHeader streakCount={streakCount} />

      <ScrollView
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
      >
        {/* Sleek Action Header Row */}
        <View style={styles.screenHeaderRow}>
          <View style={styles.screenHeaderTitleBox}>
            <Text style={styles.screenTitle}>BỘ THẺ TỪ VỰNG</Text>
            <Text style={styles.screenSubtitle}>
              {decks.length} bộ thẻ · {deckItemsStats.reduce((acc, curr) => acc + curr.total, 0)} từ vựng
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

        {isDeckLoading && decks.length === 0 ? (
          <ActivityIndicator
            size="small"
            color={Colors.duolingo.blue}
            style={{ marginVertical: 40 }}
          />
        ) : decks.length === 0 ? (
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
        ) : (
          <View style={styles.deckListContainer}>
            {deckItemsStats.map(({ deck, total, due, masteryPct }) => (
              <DuolingoCard
                key={deck.id}
                style={styles.deckCardItem}
                onPress={() => router.push(`/deck/${deck.id}`)}
              >
                {/* Deck Card Header (Tap anywhere to open card list!) */}
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
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(deck.id, deck.name);
                    }}
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

                {/* Mastery Bar */}
                <View style={styles.masteryBarRow}>
                  <ProgressBar
                    progress={masteryPct / 100}
                    height={10}
                    fillColor={Colors.duolingo.green}
                    style={{ flex: 1 }}
                  />
                  <Text style={styles.masteryPctText}>{masteryPct}% Thuộc</Text>
                </View>

                {/* Direct Action Button */}
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
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Create Deck */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="fullScreen"
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

  deckListContainer: { gap: 14 },
  deckCardItem: { padding: Spacing.md },

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

  masteryBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  masteryPctText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.duolingo.green,
  },

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
