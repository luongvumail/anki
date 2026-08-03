import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { useStore, Card } from "../../store/useStore";
import { getPinyinToneColor } from "../../lib/pinyinColor";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DeckIcon } from "../../components/ui/DeckIcon";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { AudioButton } from "../../components/ui/AudioButton";
import { ProgressBar } from "../../components/ui/ProgressBar";

import { FloatingAddButton } from "../../components/ui/FloatingAddButton";
import { AIAddCardModal } from "../../components/add/AIAddCardModal";

export default function DeckDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const fetchCards = useStore((s) => s.fetchCards);
  const fetchMoreCards = useStore((s) => s.fetchMoreCards);
  const isFetchingMore = useStore((s) => s.isFetchingMoreCards[id || ""]);
  const hasMore = useStore((s) => s.hasMoreCards[id || ""]);
  const deleteDeck = useStore((s) => s.deleteDeck);
  const resetDeckProgress = useStore((s) => s.resetDeckProgress);
  const isLoading = useStore((s) => s.isLoading);

  const [showAIAddModal, setShowAIAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const deck = useMemo(() => decks.find((d) => d.id === id), [decks, id]);
  const deckCards = useMemo(() => cards[id] || [], [cards, id]);

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return deckCards;
    const q = searchQuery.toLowerCase().trim();
    return deckCards.filter((c) => {
      const hanzi = (c.character || "").toLowerCase();
      const pinyin = (c.pinyin || "").toLowerCase();
      const trans = (c.translation || "").toLowerCase();
      return hanzi.includes(q) || pinyin.includes(q) || trans.includes(q);
    });
  }, [deckCards, searchQuery]);

  const learnedCardsCount = useMemo(() => {
    return deckCards.filter((c) => c.srs && c.srs.repetitions > 0).length;
  }, [deckCards]);

  const weakCards = useMemo(() => {
    return deckCards.filter((c) => c.srs && c.srs.easeFactor < 2.1 && c.srs.repetitions > 0);
  }, [deckCards]);

  const masteryPct = useMemo(() => {
    if (deckCards.length === 0) return 0;
    return Math.round((learnedCardsCount / deckCards.length) * 100);
  }, [deckCards.length, learnedCardsCount]);

  useEffect(() => {
    if (id) fetchCards(id);
    return () => {
      Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteDeck = () => {
    Alert.alert(
      "Xóa bộ thẻ này",
      `Bạn có chắc chắn muốn xóa bộ thẻ "${deck?.name || ""}"? Tất cả từ vựng trong bộ thẻ sẽ bị xóa vĩnh viễn!`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa vĩnh viễn",
          style: "destructive",
          onPress: async () => {
            triggerHaptic("heavy");
            await deleteDeck(id);
            router.back();
          },
        },
      ],
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      "Đặt lại tiến độ học",
      `Bạn có chắc muốn đặt lại trạng thái học của tất cả ${deckCards.length} từ vựng về trạng thái từ mới?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Reset ngay",
          style: "destructive",
          onPress: async () => {
            triggerHaptic("heavy");
            await resetDeckProgress(id);
          },
        },
      ],
    );
  };

  const speak = (character: string) => {
    Speech.speak(character, {
      language: "zh-CN",
      rate: 0.8,
    });
  };

  const renderCardItem = useCallback(
    ({ item }: { item: Card }) => {
      const pinyinColor = getPinyinToneColor(item.pinyin);

      return (
        <DuolingoCard
          style={styles.cardItem}
          onPress={() => {
            router.push(`/card/${item.id}?deckId=${id}`);
          }}
        >
          <View style={styles.cardItemRow}>
            <View style={styles.cardMainInfo}>
              <View style={styles.charRow}>
                <Text style={styles.cardCharacter}>{item.character}</Text>
                <Text style={styles.cardPinyin}>{item.pinyin}</Text>
              </View>
              <Text style={styles.cardMeaning} numberOfLines={1}>
                {item.translation}
              </Text>

              {item.radical ? (
                <View style={styles.cardRadicalTag}>
                  <Ionicons name="layers-outline" size={12} color={Colors.duolingo.purple} />
                  <Text style={styles.cardRadicalText} numberOfLines={1}>
                    {item.radical}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Speaker Audio Btn */}
            <AudioButton
              onPress={() => speak(item.character)}
              size="sm"
            />
          </View>
        </DuolingoCard>
      );
    },
    [id],
  );

  if (!deck) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.duolingo.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {deck.name}
        </Text>

        <TouchableOpacity style={styles.deleteDeckBtn} onPress={handleDeleteDeck}>
          <Ionicons name="trash-outline" size={20} color={Colors.duolingo.red} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCards}
        keyExtractor={(c) => c.id}
        renderItem={renderCardItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 40, 60) },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        onEndReached={() => {
          if (id && !searchQuery) {
            fetchMoreCards(id);
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingMore ? (
            <ActivityIndicator
              size="small"
              color={Colors.duolingo.blue}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Deck Summary Hero Card */}
            <DuolingoCard style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryTextMain}>
                  <Text style={styles.summaryTitle}>{deck.name}</Text>
                  <Text style={styles.summarySub}>{deckCards.length} thẻ từ vựng</Text>
                </View>
              </View>

              {deck.description ? (
                <Text style={styles.deckDescText}>{deck.description}</Text>
              ) : null}

              <View style={styles.masteryBarRow}>
                <ProgressBar
                  progress={masteryPct / 100}
                  height={12}
                  fillColor={Colors.duolingo.green}
                  style={{ flex: 1 }}
                />
                <Text style={styles.masteryPctText}>{masteryPct}% Thuộc</Text>
              </View>

              {/* Action Buttons */}
              <DuolingoButton
                title="BẮT ĐẦU ÔN BỘ NÀY"
                variant="primary"
                size="lg"
                disabled={deckCards.length === 0}
                onPress={() => router.push(`/study/${deck.id}`)}
                style={{ marginTop: Spacing.md }}
              />

              <DuolingoButton
                title="ĐẶT LẠI TIẾN ĐỘ BỘ HỌC"
                variant="secondary"
                size="lg"
                disabled={deckCards.length === 0}
                onPress={handleResetProgress}
                style={{ marginTop: 8 }}
              />
            </DuolingoCard>

            {weakCards.length > 0 && (
              <DuolingoCard style={styles.weakWarningCard}>
                <View style={styles.weakWarningHeader}>
                  <Text style={styles.weakWarningTitle}>
                    CẦN CHÚ Ý: {weakCards.length} TỪ DỄ QUÊN!
                  </Text>
                </View>
                <Text style={styles.weakWarningSub}>
                  Các từ này có tần suất hay quên cao. Hãy dành thêm thời gian ôn tập lại.
                </Text>
              </DuolingoCard>
            )}

            <SectionTitle>
              DANH SÁCH TỪ VỰNG ({searchQuery ? `${filteredCards.length}/${deckCards.length}` : deckCards.length})
            </SectionTitle>

            {/* Smart Search Bar */}
            {deckCards.length > 0 && (
              <View style={styles.searchBarBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo Hán tự, Pinyin hoặc nghĩa..."
                  placeholderTextColor={Colors.duolingo.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                    <Ionicons name="close-circle" size={18} color={Colors.duolingo.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors.duolingo.blue}
              style={{ marginVertical: 30 }}
            />
          ) : searchQuery.trim().length > 0 ? (
            <DuolingoCard style={styles.emptyCard}>
              <Ionicons name="search-outline" size={36} color={Colors.duolingo.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Không tìm thấy từ vựng!</Text>
              <Text style={styles.emptySub}>
                Không có từ nào khớp với từ khóa "{searchQuery}".
              </Text>
              <TouchableOpacity style={styles.resetSearchBtn} onPress={() => setSearchQuery("")}>
                <Text style={styles.resetSearchText}>Xóa từ khóa tìm kiếm</Text>
              </TouchableOpacity>
            </DuolingoCard>
          ) : (
            <DuolingoCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có từ vựng nào!</Text>
              <Text style={styles.emptySub}>
                Dùng chức năng "Thêm thẻ AI" để nạp từ vựng tự động.
              </Text>
            </DuolingoCard>
          )
        }
      />

      {/* Floating Action Button (FAB) to AI Add Cards */}
      <FloatingAddButton
        onPress={() => setShowAIAddModal(true)}
        bottomOffset={Math.max(insets.bottom + 20, 30)}
      />

      {/* AI Add Card Full Overlay Modal */}
      {showAIAddModal && (
        <AIAddCardModal
          visible={showAIAddModal}
          onClose={() => setShowAIAddModal(false)}
          initialDeckId={deck.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.duolingo.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.duolingo.bg,
  },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.duolingo.bg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.duolingo.cardBorder,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.white,
    textAlign: "center",
    marginHorizontal: Spacing.sm,
  },
  deleteDeckBtn: { padding: 4 },

  listContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },
  listHeader: { marginBottom: Spacing.xs },

  summaryCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  summaryTopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: Spacing.xs },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.duolingo.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTextMain: { flex: 1 },
  summaryTitle: { fontSize: 22, fontWeight: "800", color: Colors.text.white },
  summarySub: { fontSize: 13, color: Colors.duolingo.textMuted, fontWeight: "600" },
  deckDescText: { fontSize: 14, color: Colors.duolingo.textMuted, marginTop: 4 },

  cardItem: { marginBottom: 10, padding: Spacing.md },
  cardItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardMainInfo: { flex: 1, paddingRight: 8 },
  charRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  cardCharacter: { fontSize: 24, fontWeight: "800", color: Colors.text.white },
  cardPinyin: { fontSize: 16, fontWeight: "700", color: Colors.duolingo.blue },
  cardMeaning: { fontSize: 15, color: Colors.duolingo.green, marginTop: 2, fontWeight: "600" },
  cardRadicalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.duolingo.purpleDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  cardRadicalText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.duolingo.purple,
    flexShrink: 1,
  },
  speakSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.duolingo.blueDim,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: Spacing.md,
  },
  masteryBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: Spacing.sm,
  },
  masteryPctText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.green,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: Colors.text.white },
  emptySub: { fontSize: 13, color: Colors.duolingo.textMuted, marginTop: 4, textAlign: "center" },

  weakWarningCard: {
    backgroundColor: Colors.duolingo.yellowDim,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: "rgba(255, 200, 0, 0.3)",
    borderWidth: 1,
  },
  weakWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  weakWarningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.yellow,
  },
  weakWarningSub: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    lineHeight: 16,
  },
  searchBarBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.duolingo.bgSoftDark,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.duolingo.border,
    paddingHorizontal: Spacing.md,
    height: 46,
    marginVertical: Spacing.xs,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: "600",
  },
  clearSearchBtn: { padding: 4 },
  resetSearchBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.duolingo.bgSoftDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.duolingo.border,
  },
  resetSearchText: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: "800",
  },
});
