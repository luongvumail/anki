import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { computeDueCount, getDeckMasteryPct } from "../../domain/card/cardUtils.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { SearchBar } from "../components/SearchBar.js";
import { theme } from "../theme/theme.js";
import { appStore } from "../store/useAppStore.js";

export interface DecksScreenProps {
  onSelectDeck: (deckId: string) => void;
}

export const DecksScreen: React.FC<DecksScreenProps> = ({ onSelectDeck }) => {
  const [storeState, setStoreState] = useState(appStore.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    appStore.loadDecks();
    const unsubscribe = appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
    return unsubscribe;
  }, []);

  const handleCreateDeck = () => {
    if (!newTitle.trim()) return;
    appStore.addDeck(newTitle.trim(), newDesc.trim());
    setNewTitle("");
    setNewDesc("");
    setShowCreateModal(false);
  };

  const handleDeleteDeck = (deckId: string, title: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa bộ thẻ "${title}" cùng toàn bộ từ vựng bên trong không?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => appStore.deleteDeck(deckId) },
      ]
    );
  };

  const [selectedHskFilter, setSelectedHskFilter] = useState<number | null>(null);

  const filteredDecks = storeState.decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedHskFilter === null) return true;
    const titleLower = deck.title.toLowerCase();
    if (selectedHskFilter === 4) {
      return titleLower.includes("hsk 4") || titleLower.includes("hsk 5") || titleLower.includes("hsk 6");
    }
    return titleLower.includes(`hsk ${selectedHskFilter}`) || titleLower.includes(`hsk${selectedHskFilter}`);
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Danh Sách Bộ Thẻ</Text>
          <DuolingoButton
            title="+ TẠO BỘ THẺ"
            variant="primary"
            onPress={() => setShowCreateModal(true)}
            accessibilityLabel="Tạo bộ thẻ mới"
          />
        </View>

        {/* Search Input Component */}
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm kiếm bộ thẻ..."
          />
        </View>

        {/* HSK Level Filter Tabs */}
        <View style={styles.hskFilterRow}>
          {[
            { label: "Tất cả", value: null },
            { label: "HSK 1", value: 1 },
            { label: "HSK 2", value: 2 },
            { label: "HSK 3", value: 3 },
            { label: "HSK 4+", value: 4 },
          ].map((tab) => (
            <Pressable
              key={tab.label}
              onPress={() => setSelectedHskFilter(tab.value)}
              style={[
                styles.hskTab,
                selectedHskFilter === tab.value && styles.hskTabActive,
              ]}
            >
              <Text
                style={[
                  styles.hskTabText,
                  selectedHskFilter === tab.value && styles.hskTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Decks List */}
        <View>
          {filteredDecks.length > 0 ? (
            filteredDecks.map((deck) => {
              const deckCards = storeState.cards[deck.id] || [];
              const totalCount = deckCards.length || deck.cardCount || 0;
              const dueCount = computeDueCount(deckCards);
              const masteryPct = getDeckMasteryPct(totalCount, dueCount, deckCards);

              return (
                <DuolingoCard key={deck.id} accessibilityLabel={`Bộ thẻ: ${deck.title}`}>
                  <View style={styles.cardHeader}>
                    <View style={styles.deckInfo}>
                      <Text style={styles.deckTitle}>{deck.title}</Text>
                      <Text style={styles.deckDesc}>
                        {deck.description || "Bộ thẻ từ vựng Hán tự"}
                      </Text>
                      <Text style={styles.deckStats}>
                        {totalCount} từ vựng {dueCount > 0 ? ` · ${dueCount} thẻ cần ôn` : ""}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteDeck(deck.id, deck.title)}
                      accessibilityLabel={`Xóa bộ thẻ ${deck.title}`}
                      style={styles.deleteBtn}
                    >
                      <Icon name="trash" size={20} color={theme.colors.danger} />
                    </Pressable>
                  </View>

                  {/* Mastery Bar */}
                  <View style={styles.masteryRow}>
                    <View style={styles.progressFlex}>
                      <ProgressBar progress={masteryPct} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.masteryText}>{masteryPct}% Thuộc</Text>
                  </View>

                  <DuolingoButton
                    title={dueCount > 0 ? `HỌC BÀI NGAY (${dueCount} THẺ)` : "XEM DANH SÁCH THẺ"}
                    variant={dueCount > 0 ? "primary" : "secondary"}
                    onPress={() => onSelectDeck(deck.id)}
                    accessibilityLabel={`Học bộ thẻ ${deck.title}`}
                  />
                </DuolingoCard>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Không tìm thấy bộ thẻ nào phù hợp.</Text>
          )}
        </View>
      </ScrollView>

      {/* Modal Create Deck */}
      {showCreateModal && (
        <Modal visible={showCreateModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Tạo Bộ Thẻ Mới</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Tên bộ thẻ *</Text>
                <TextInput
                  style={styles.inputText}
                  placeholder="Ví dụ: HSK 2 Căn Bản"
                  placeholderTextColor={theme.colors.textLight}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Mô tả</Text>
                <TextInput
                  style={styles.inputText}
                  placeholder="Ví dụ: 150 từ vựng chủ đề giao tiếp"
                  placeholderTextColor={theme.colors.textLight}
                  value={newDesc}
                  onChangeText={setNewDesc}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <DuolingoButton
                  title="HỦY"
                  variant="secondary"
                  onPress={() => setShowCreateModal(false)}
                />
                <DuolingoButton
                  title="TẠO BỘ THẺ"
                  variant="primary"
                  onPress={handleCreateDeck}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  pageTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  searchWrapper: {
    marginBottom: theme.spacing.md,
  },
  hskFilterRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  hskTab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  hskTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  hskTabText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  hskTabTextActive: {
    color: theme.colors.white,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  deckInfo: {
    flex: 1,
  },
  deckTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  deckDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  deckStats: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
  masteryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  progressFlex: {
    flex: 1,
  },
  masteryText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontSize: theme.fontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalBox: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 450,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputText: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "flex-end",
    marginTop: theme.spacing.md,
  },
});
