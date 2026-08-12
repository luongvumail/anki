import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { useStore } from "../store/useStore";
import { triggerHaptic } from "../constants/theme";
import { APP_CONFIG } from "../constants/config";

import { computeLearnedCount, getDeckMasteryPct } from "../lib/deckUtils";

export function useDeckDetail(id: string | undefined) {
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
  const deckCards = useMemo(() => cards[id || ""] || [], [cards, id]);

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
    return computeLearnedCount(deckCards);
  }, [deckCards]);

  const weakCards = useMemo(() => {
    return deckCards.filter((c) => c.srs && c.srs.easeFactor < 2.1 && c.srs.repetitions > 0);
  }, [deckCards]);

  const masteryPct = useMemo(() => {
    return getDeckMasteryPct(deckCards.length, 0, deckCards);
  }, [deckCards]);


  useEffect(() => {
    if (id) fetchCards(id);
    return () => {
      Speech.stop();
    };
  }, [id, fetchCards]);

  const handleDeleteDeck = useCallback(() => {
    if (!id) return;
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
  }, [deck?.name, deleteDeck, id]);

  const handleResetProgress = useCallback(() => {
    if (!id) return;
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
  }, [deckCards.length, id, resetDeckProgress]);

  const speak = useCallback((character: string) => {
    Speech.speak(character, {
      language: "zh-CN",
      rate: APP_CONFIG.SPEECH_RATE,
    });
  }, []);

  const handleEndReached = useCallback(() => {
    if (id && !searchQuery && hasMore && !isFetchingMore) {
      fetchMoreCards(id);
    }
  }, [fetchMoreCards, hasMore, id, isFetchingMore, searchQuery]);

  return {
    deck,
    deckCards,
    filteredCards,
    learnedCardsCount,
    weakCards,
    masteryPct,
    isLoading,
    isFetchingMore,
    hasMore,
    showAIAddModal,
    setShowAIAddModal,
    searchQuery,
    setSearchQuery,
    handleDeleteDeck,
    handleResetProgress,
    speak,
    handleEndReached,
  };
}
