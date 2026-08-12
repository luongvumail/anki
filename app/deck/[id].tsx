import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Card } from "../../store/useStore";
import { Colors, Spacing, Radii } from "../../constants/theme";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { AudioButton } from "../../components/ui/AudioButton";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { FloatingAddButton } from "../../components/ui/FloatingAddButton";
import { AIAddCardModal } from "../../components/add/AIAddCardModal";
import { SkeletonCard } from "../../components/ui/SkeletonCard";
import { useDeckDetail } from "../../hooks/useDeckDetail";

export default function DeckDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    deck,
    deckCards,
    filteredCards,
    weakCards,
    masteryPct,
    isLoading,
    isFetchingMore,
    showAIAddModal,
    setShowAIAddModal,
    searchQuery,
    setSearchQuery,
    handleDeleteDeck,
    handleResetProgress,
    speak,
    handleEndReached,
  } = useDeckDetail(id);

  const renderCardItem = useCallback(
    ({ item }: { item: Card }) => {
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
            <AudioButton onPress={() => speak(item.character)} size="sm" />
          </View>
        </DuolingoCard>
      );
    },
    [id, speak]
  );

  if (!deck) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top + 8, 44) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.white} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: Spacing.pageMargin, marginTop: Spacing.md }}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
        </View>
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
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={{ marginVertical: 8 }}>
              <SkeletonCard lines={1} />
            </View>
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
            <View style={{ marginTop: Spacing.md }}>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
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
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.duolingo.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.duolingo.cardBorder,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.white,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  deleteDeckBtn: {
    padding: 6,
  },
  listContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
  },
  listHeader: {
    marginBottom: Spacing.sm,
  },
  summaryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTextMain: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text.white,
  },
  summarySub: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  deckDescText: {
    fontSize: 13,
    color: Colors.text.white,
    marginTop: 8,
    lineHeight: 18,
  },
  masteryBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  masteryPctText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.green,
  },
  weakWarningCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: "rgba(255, 75, 75, 0.1)",
    borderColor: Colors.duolingo.red,
  },
  weakWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weakWarningTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.red,
  },
  weakWarningSub: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  searchBarBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.duolingo.cardBg,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.white,
    fontWeight: "600",
  },
  clearSearchBtn: {
    padding: 4,
  },
  cardItem: {
    padding: Spacing.md,
    marginBottom: 10,
  },
  cardItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  charRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  cardCharacter: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.white,
  },
  cardPinyin: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.duolingo.blue,
  },
  cardMeaning: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  cardRadicalTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  cardRadicalText: {
    fontSize: 11,
    color: Colors.duolingo.purple,
    fontWeight: "600",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.white,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  resetSearchBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.duolingo.cardBottom,
    borderRadius: Radii.md,
  },
  resetSearchText: {
    fontSize: 12,
    color: Colors.duolingo.blue,
    fontWeight: "700",
  },
});
