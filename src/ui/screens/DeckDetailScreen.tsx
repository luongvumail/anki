import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CardEntity } from "../../domain/card/cardEntity.js";
import { computeLearnedCount } from "../../domain/card/cardUtils.js";
import { DeckEntity } from "../../domain/deck/deckEntity.js";
import { AIAddCardModal } from "../components/AIAddCardModal.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { FloatingAddButton } from "../components/FloatingAddButton.js";
import { Icon } from "../components/Icon.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { SearchBar } from "../components/SearchBar.js";
import { theme } from "../theme/theme.js";
import { appStore } from "../store/useAppStore.js";

export interface DeckDetailScreenProps {
  deckId: string;
  onBack: () => void;
  onStartStudy: (deckId: string) => void;
  onOpenCardDetail: (cardId: string) => void;
}

export const DeckDetailScreen: React.FC<DeckDetailScreenProps> = ({
  deckId,
  onBack,
  onStartStudy,
  onOpenCardDetail,
}) => {
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [deck, setDeck] = useState<DeckEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  useEffect(() => {
    appStore.fetchCards(deckId).then(setCards);
    const found = appStore.getState().decks.find((d) => d.id === deckId);
    if (found) setDeck(found);

    const unsubscribe = appStore.subscribe(() => {
      const updatedCards = appStore.getState().cards[deckId] || [];
      setCards(updatedCards);
    });
    return unsubscribe;
  }, [deckId]);

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase().trim();
    return cards.filter(
      (c) =>
        c.kanji.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

  const learnedCount = useMemo(() => computeLearnedCount(cards), [cards]);
  const masteryPct = useMemo(() => {
    if (cards.length === 0) return 0;
    return Math.round((learnedCount / cards.length) * 100);
  }, [cards.length, learnedCount]);

  const weakCards = useMemo(() => {
    return cards.filter(
      (c) => c.fsrsState && c.fsrsState.difficulty > 7.0 && c.fsrsState.reps > 0
    );
  }, [cards]);

  const handleDeleteCard = (e: any, cardId: string) => {
    e.stopPropagation();
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa thẻ này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => appStore.deleteCard(cardId, deckId) },
    ]);
  };

  const handleResetProgress = () => {
    Alert.alert(
      "Xác nhận đặt lại",
      `Bạn có chắc muốn đặt lại tiến độ học của tất cả ${cards.length} từ vựng về trạng thái từ mới?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đặt lại", style: "destructive", onPress: () => appStore.resetDeckProgress(deckId) },
      ]
    );
  };

  const speakHanzi = (e: any, kanji: string) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(kanji);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Icon name="decks" size={18} color={theme.colors.primary} />
          <Text style={styles.backBtnText}>Quay lại danh sách bộ thẻ</Text>
        </Pressable>

        {deck && (
          <DuolingoCard accessibilityLabel={`Chi tiết bộ thẻ ${deck.title}`}>
            <Text style={styles.deckTitle}>{deck.title}</Text>
            <Text style={styles.deckDesc}>
              {deck.description || `${cards.length} thẻ từ vựng`}
            </Text>

            {/* Mastery Bar */}
            <View style={styles.masterySection}>
              <View style={styles.masteryHeader}>
                <Text style={styles.masteryTitle}>Mức độ thành thạo</Text>
                <Text style={styles.masterySubtitle}>
                  {masteryPct}% Thuộc ({learnedCount}/{cards.length})
                </Text>
              </View>
              <ProgressBar progress={masteryPct} accessibilityLabel="Tiến độ thành thạo bộ thẻ" />
            </View>

            <View style={styles.actionCol}>
              <DuolingoButton
                title="HỌC BỘ THẺ NÀY"
                variant="primary"
                disabled={cards.length === 0}
                onPress={() => onStartStudy(deckId)}
                accessibilityLabel="Học bộ thẻ này"
              />

              {cards.length > 0 && (
                <Pressable onPress={handleResetProgress} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>ĐẶT LẠI TIẾN ĐỘ HỌC</Text>
                </Pressable>
              )}
            </View>
          </DuolingoCard>
        )}

        {/* Weak Cards Warning */}
        {weakCards.length > 0 && (
          <View style={styles.warningSection}>
            <DuolingoCard accessibilityLabel="Cảnh báo từ dễ quên">
              <View style={styles.warningHeader}>
                <Icon name="wrench" color={theme.colors.secondary} />
                <Text style={styles.warningTitle}>CẦN CHÚ Ý: {weakCards.length} TỪ DỄ QUÊN!</Text>
              </View>
              <Text style={styles.warningText}>
                Các từ này có độ khó cao. Hãy học tập trung hoặc ôn luyện thêm.
              </Text>
            </DuolingoCard>
          </View>
        )}

        {/* Search Bar Component */}
        {cards.length > 0 && (
          <View style={styles.searchSection}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo Hán tự, Pinyin hoặc Nghĩa..."
            />
          </View>
        )}

        <Text style={styles.sectionHeader}>
          DANH SÁCH THẺ TỪ VỰNG ({filteredCards.length}/{cards.length})
        </Text>

        {/* Card List */}
        <View style={styles.cardList}>
          {filteredCards.length === 0 ? (
            <DuolingoCard accessibilityLabel="Không tìm thấy từ vựng">
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `Không tìm thấy từ vựng khớp với "${searchQuery}"`
                  : "Bộ thẻ này chưa có từ vựng nào."}
              </Text>
            </DuolingoCard>
          ) : (
            filteredCards.map((card) => (
              <Pressable
                key={card.id}
                onPress={() => onOpenCardDetail(card.id)}
                style={styles.cardPressable}
              >
                <DuolingoCard accessibilityLabel={`Thẻ ${card.kanji}`}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLeft}>
                      <View style={styles.wordHeader}>
                        <Text style={styles.kanjiText}>{card.kanji}</Text>
                        <Text style={styles.pinyinText}>{card.pinyin}</Text>
                      </View>
                      <Text style={styles.meaningText}>{card.meaning}</Text>
                    </View>

                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={(e) => speakHanzi(e, card.kanji)}
                        accessibilityLabel="Phát âm"
                        style={styles.iconCircle}
                      >
                        <Icon name="audio" size={18} color={theme.colors.textPrimary} />
                      </Pressable>

                      <Pressable
                        onPress={(e) => handleDeleteCard(e, card.id)}
                        accessibilityLabel="Xóa thẻ"
                        style={styles.deleteIconBtn}
                      >
                        <Icon name="trash" size={18} color={theme.colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                </DuolingoCard>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating AI Card Modal */}
      <FloatingAddButton onPress={() => setIsAIModalOpen(true)} />
      <AIAddCardModal
        visible={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        defaultDeckId={deckId}
      />
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
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  backBtnText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  deckTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  deckDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  masterySection: {
    marginBottom: theme.spacing.lg,
  },
  masteryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  masteryTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  masterySubtitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  actionCol: {
    gap: theme.spacing.sm,
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  resetBtnText: {
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  warningSection: {
    marginTop: theme.spacing.lg,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  warningTitle: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.secondary,
    fontSize: theme.fontSize.sm,
  },
  warningText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  searchSection: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  cardList: {
    gap: theme.spacing.md,
  },
  cardPressable: {},
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  kanjiText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  pinyinText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.base,
  },
  meaningText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  cardActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: theme.badges.neutral.bg,
    borderRadius: theme.radius.full,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIconBtn: {
    padding: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontSize: theme.fontSize.sm,
  },
});
