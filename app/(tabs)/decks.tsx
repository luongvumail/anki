import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useStore } from "../../store/useStore";
import { getFirestoreErrorMessage } from "../../lib/errorHandler";
import { Spacing, Radii, Typography, Layout, BorderWidths, VECTOR_DECK_ICONS, triggerHaptic } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
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
  const { theme } = useTheme();
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
        color: theme.blue,
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
  }, [createDeck, deckDesc, deckName, selectedIcon, theme.blue]);

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
            onPress: () => deleteDeck(deckId),
          },
        ],
      );
    },
    [deleteDeck],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <DuolingoHeader streakCount={streakCount} />

      <FlatList
        data={deckItemsStats}
        keyExtractor={(item) => item.deck.id}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.green} />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.screenHeaderRow}>
            <View style={styles.screenHeaderTitleBox}>
              <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>QUẢN LÝ BỘ THẺ</Text>
              <Text style={[styles.screenSubtitle, { color: theme.textMuted }]}>
                {decks.length} Bộ thẻ vựng Hán ngữ
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.addDeckHeaderBtn,
                { backgroundColor: theme.blue, borderBottomColor: theme.blueDark },
              ]}
              onPress={() => {
                triggerHaptic("selection");
                setShowCreate(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={Layout.iconMd} color="#FFFFFF" />
              <Text style={styles.addDeckHeaderBtnText}>THÊM BỘ</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <DeckCardItem itemStats={item} onDelete={handleDelete} />}
        ListEmptyComponent={
          isLoading ? (
            <View>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
          ) : (
            <DuolingoCard style={styles.emptyCard}>
              <Ionicons name="book-outline" size={Layout.avatarXl} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>CHƯA CÓ BỘ TỪ VỰNG NÀO</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                Tạo bộ từ đầu tiên để bắt đầu hành trình chinh phục Hán Tự ngay hôm nay!
              </Text>
              <DuolingoButton
                title="TẠO BỘ TỪ MỚI"
                icon={<Ionicons name="add" size={Layout.iconMd} color="#FFFFFF" />}
                variant="primary"
                size="lg"
                onPress={() => setShowCreate(true)}
                style={{ marginTop: Spacing.lg }}
              />
            </DuolingoCard>
          )
        }
      />

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View
          style={[
            styles.modalContainer,
            { paddingTop: Math.max(insets.top + Spacing.sm, Spacing.cellMinHeight), backgroundColor: theme.bg },
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>TẠO BỘ THẺ MỚI</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={Layout.iconLg} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <DuolingoCard style={{ padding: Spacing.md }}>
              <FormField
                label="Tên bộ thẻ (Bắt buộc)"
                value={deckName}
                onChangeText={setDeckName}
                placeholder="Ví dụ: HSK 3 - Từ Vựng Căn Bản"
              />
              <View style={{ height: Spacing.md }} />
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
                    style={[
                      styles.iconPickerItem,
                      { backgroundColor: theme.bgSoft, borderBottomColor: theme.cardBottom },
                      isSelected && { backgroundColor: theme.blueDim, borderBottomColor: theme.blueDark },
                    ]}
                    onPress={() => setSelectedIcon(iconName)}
                  >
                    <DeckIcon
                      name={iconName}
                      size={Layout.iconLg}
                      color={isSelected ? theme.blue : theme.textMuted}
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
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },
  screenHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  screenHeaderTitleBox: { flex: 1 },
  screenTitle: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold, letterSpacing: 0.5 },
  screenSubtitle: { fontSize: Typography.caption.fontSize, fontWeight: Typography.weight.semibold, marginTop: 2 },
  addDeckHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: BorderWidths.thin,
  },
  addDeckHeaderBtnText: { fontSize: Typography.caption1.fontSize, fontWeight: Typography.weight.extraBold, color: "#FFFFFF" },
  emptyCard: { alignItems: "center", justifyContent: "center", padding: Spacing.xl, marginTop: Spacing.md },
  emptyTitle: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold, marginTop: Spacing.md },
  emptySub: { fontSize: Typography.caption.fontSize, marginTop: Spacing.xs, textAlign: "center" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.md,
    borderBottomWidth: BorderWidths.thin,
  },
  modalTitle: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold },
  modalScroll: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.cellPadding, marginBottom: Spacing.md },
  iconPickerItem: {
    width: Layout.btnHeightXl,
    height: Layout.btnHeightXl,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: BorderWidths.thin,
  },
});
