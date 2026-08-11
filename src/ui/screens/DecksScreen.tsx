import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { computeDueCount, getDeckMasteryPct } from "../../domain/card/cardUtils.js";
import { AIAddCardModal } from "../components/AIAddCardModal.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { FloatingAddButton } from "../components/FloatingAddButton.js";
import { Icon } from "../components/Icon.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { SearchBar } from "../components/SearchBar.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { appStore } from "../store/useAppStore.js";

export interface DecksScreenProps {
  onSelectDeck: (deckId: string) => void;
}

export const DecksScreen: React.FC<DecksScreenProps> = ({ onSelectDeck }) => {
  const { theme } = useTheme();
  const [storeState, setStoreState] = useState(appStore.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    appStore.loadDecks();
    const unsubscribe = appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
    return unsubscribe;
  }, []);

  const handleCreateDeck = async () => {
    if (!newTitle.trim()) return;
    try {
      await appStore.addDeck(newTitle.trim(), newDesc.trim());
      setNewTitle("");
      setNewDesc("");
      setShowCreateModal(false);
    } catch (e: any) {
      Alert.alert("Lỗi tạo bộ thẻ", e.message || "Tên bộ thẻ này đã tồn tại.");
    }
  };

  const handleDeleteDeck = (deckId: string, title: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa bộ thẻ "${title}" cùng toàn bộ từ vựng bên trong không?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => appStore.deleteDeck(deckId) },
      ],
    );
  };

  const decks = storeState.decks;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Icon name="decks" size={26} color={theme.colors.primary} />
            <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>
              Bộ Thẻ Của Tôi
            </Text>
          </View>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={[styles.createBtnCompact, { backgroundColor: theme.colors.primary }]}
            accessibilityLabel="Tạo bộ thẻ mới"
          >
            <Icon name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Tạo Bộ Thẻ</Text>
          </Pressable>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Quản lý và ôn tập các bộ từ vựng Hán ngữ của bạn.
        </Text>

        {/* Decks List */}
        <View style={styles.deckListMargin}>
          {decks.length > 0 ? (
            decks.map((deck) => {
              const deckCards = storeState.cards[deck.id] || [];
              const totalCount = deckCards.length || deck.cardCount || 0;
              const dueCount = computeDueCount(deckCards);
              const masteryPct = getDeckMasteryPct(totalCount, dueCount, deckCards);

              return (
                <DuolingoCard key={deck.id} accessibilityLabel={`Bộ thẻ: ${deck.title}`}>
                  <View style={styles.cardHeader}>
                    <View style={styles.deckInfo}>
                      <Text style={[styles.deckTitle, { color: theme.colors.textPrimary }]}>
                        {deck.title}
                      </Text>
                      <Text style={[styles.deckDesc, { color: theme.colors.textSecondary }]}>
                        {deck.description || "Bộ thẻ từ vựng Hán tự"}
                      </Text>
                      <Text style={[styles.deckStats, { color: theme.colors.textSecondary }]}>
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
                    <Text style={[styles.masteryText, { color: theme.colors.primary }]}>
                      {masteryPct}% Thuộc
                    </Text>
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
            <DuolingoCard accessibilityLabel="Chưa có bộ thẻ nào">
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <Icon name="decks" size={36} color={theme.colors.primary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: theme.colors.textPrimary,
                    marginTop: 8,
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  BẠN CHƯA CÓ BỘ THẺ NÀO
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.textSecondary,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Hãy bấm nút bên dưới để tạo bộ thẻ từ vựng đầu tiên của bạn!
                </Text>
                <View style={{ width: "100%" }}>
                  <DuolingoButton
                    title="+ TẠO BỘ THẺ MỚI"
                    variant="primary"
                    onPress={() => setShowCreateModal(true)}
                  />
                </View>
              </View>
            </DuolingoCard>
          )}
        </View>
      </ScrollView>

      {/* Modal Create Deck */}
      {showCreateModal && (
        <Modal visible={showCreateModal} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowCreateModal(false)}>
          <SafeAreaView style={[styles.fullModalContainer, { backgroundColor: theme.colors.bg }]}>
            <View style={styles.fullModalHeader}>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                style={styles.closeBtn}
                accessibilityLabel="Đóng modal tạo bộ thẻ"
              >
                <Icon name="close" size={24} color={theme.colors.textPrimary} />
              </Pressable>
              <Text style={[styles.fullModalTitle, { color: theme.colors.textPrimary }]}>
                Tạo Bộ Thẻ Mới
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.fullModalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                  Tên bộ thẻ *
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: theme.colors.cardBg,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  placeholder="Ví dụ: HSK 2 Căn Bản"
                  placeholderTextColor={theme.colors.textLight}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                  Mô tả
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: theme.colors.cardBg,
                      color: theme.colors.textPrimary,
                    },
                  ]}
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
                <DuolingoButton title="TẠO BỘ THẺ" variant="primary" onPress={handleCreateDeck} />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Floating Add Card Button */}
      <FloatingAddButton onPress={() => setIsAIModalOpen(true)} />

      {/* AI Add Card Modal */}
      <AIAddCardModal visible={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
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
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  createBtnCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  deckListMargin: {
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  deckInfo: {
    flex: 1,
  },
  deckTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  deckDesc: {
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  deckStats: {
    fontSize: theme.fontSize.xs,
    marginTop: 4,
    fontWeight: theme.fontWeight.bold,
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
  fullModalContainer: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  closeBtn: {
    padding: 6,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  fullModalBody: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "flex-end",
    marginTop: theme.spacing.md,
  },
});
