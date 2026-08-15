import { useState, useCallback } from "react";
import { useStore } from "../store/useStore";
import { generateCardDataBatch, generateCardData, CardData } from "../lib/gemini";
import { triggerHaptic } from "../constants/theme";
import { createDefaultFSRSState } from "../lib/srs";
import { getGeminiErrorMessage, getDatabaseErrorMessage } from "../lib/errorHandler";

export function useAICardGenerator(initialDeckId?: string, onClose?: () => void) {
  const decks = useStore((s) => s.decks);
  const cards = useStore((s) => s.cards);
  const addCardsBatch = useStore((s) => s.addCardsBatch);

  const [prompt, setPrompt] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    initialDeckId || (decks.length > 0 ? decks[0].id : ""),
  );
  const [isDeckPickerOpen, setIsDeckPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    triggerHaptic("medium");

    try {
      let existingDeckCards = cards[selectedDeckId];
      if (!existingDeckCards && selectedDeckId) {
        existingDeckCards = await useStore.getState().fetchCards(selectedDeckId);
      }
      if (!existingDeckCards) existingDeckCards = [];

      const existingCharSet = new Set(
        existingDeckCards.map((c) => (c.character || "").trim().toLowerCase()),
      );

      const rawInputs = prompt
        .split(/[,，\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      let inputsToGenerate = rawInputs;
      let skippedDuplicatesCount = 0;

      // Filter out duplicate words if user inputs a list of words
      if (rawInputs.length > 1) {
        inputsToGenerate = rawInputs.filter(
          (word) => !existingCharSet.has(word.toLowerCase()),
        );
        skippedDuplicatesCount = rawInputs.length - inputsToGenerate.length;

        if (inputsToGenerate.length === 0) {
          setErrorMessage(`Tất cả ${rawInputs.length} từ vựng này đều đã có sẵn trong bộ thẻ!`);
          triggerHaptic("error");
          setLoading(false);
          return;
        }
      }

      const rawResults =
        inputsToGenerate.length > 1
          ? await generateCardDataBatch(inputsToGenerate)
          : [await generateCardData(prompt.trim())];

      // Double-check & filter out any AI-generated cards that already exist in the deck
      const results = rawResults.filter(
        (card) => !existingCharSet.has((card.character || "").trim().toLowerCase()),
      );

      if (results && results.length > 0) {
        setGeneratedCards(results);
        setSelectedIndices(new Set(results.map((_, i) => i)));
        if (skippedDuplicatesCount > 0) {
          setErrorMessage(
            `Đã tự động loại bỏ ${skippedDuplicatesCount} từ đã có trong bộ thẻ.`,
          );
        }
        triggerHaptic("success");
      } else {
        setErrorMessage(
          skippedDuplicatesCount > 0
            ? "Tất cả từ vựng này đều đã có sẵn trong bộ thẻ!"
            : "AI không tạo được từ vựng từ từ khóa này. Vui lòng thử từ khóa khác.",
        );
        triggerHaptic("error");
      }
    } catch (err: unknown) {
      setErrorMessage(getGeminiErrorMessage(err));
      triggerHaptic("error");
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedDeckId, cards]);

  const toggleSelectCard = useCallback((index: number) => {
    triggerHaptic("selection");
    setSelectedIndices((prev) => {
      const updated = new Set(prev);
      if (updated.has(index)) {
        updated.delete(index);
      } else {
        updated.add(index);
      }
      return updated;
    });
  }, []);

  const handleSaveSelected = useCallback(async () => {
    if (!selectedDeckId) {
      setErrorMessage("Vui lòng chọn bộ thẻ trước khi nạp.");
      return;
    }

    const cardsToSave = generatedCards.filter((_, i) => selectedIndices.has(i));
    if (cardsToSave.length === 0) return;

    setLoading(true);
    triggerHaptic("medium");

    try {
      const formattedCards = cardsToSave.map((cardData) => ({
        deckId: selectedDeckId,
        character: cardData.character || "",
        traditional: cardData.traditional,
        pinyin: cardData.pinyin || "",
        hanviet: cardData.hanviet,
        translation: cardData.translation || "",
        examples: cardData.examples || [],
        radical: cardData.radical,
        strokeCount: cardData.strokeCount,
        hskLevel: cardData.hskLevel,
        tags: cardData.tags || ["AI-Generated"],
        srs: createDefaultFSRSState(),
      }));

      await addCardsBatch(formattedCards);

      triggerHaptic("success");
      if (onClose) onClose();
    } catch (err: unknown) {
      setErrorMessage(getDatabaseErrorMessage(err));
      triggerHaptic("error");
    } finally {
      setLoading(false);
    }
  }, [selectedDeckId, generatedCards, selectedIndices, addCardsBatch, onClose]);

  return {
    prompt,
    setPrompt,
    selectedDeckId,
    setSelectedDeckId,
    isDeckPickerOpen,
    setIsDeckPickerOpen,
    loading,
    generatedCards,
    selectedIndices,
    errorMessage,
    decks,
    handleGenerate,
    toggleSelectCard,
    handleSaveSelected,
  };
}
