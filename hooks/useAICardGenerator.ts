import { useState, useCallback } from "react";
import { useStore } from "../store/useStore";
import { generateCardDataBatch, generateCardData, CardData } from "../lib/gemini";
import { triggerHaptic } from "../constants/theme";
import { createDefaultFSRSState } from "../lib/srs";
import { getGeminiErrorMessage } from "../lib/errorHandler";

export function useAICardGenerator(initialDeckId?: string, onClose?: () => void) {
  const decks = useStore((s) => s.decks);
  const addCard = useStore((s) => s.addCard);

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
      const inputs = prompt
        .split(/[,，\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const results =
        inputs.length > 1
          ? await generateCardDataBatch(inputs)
          : [await generateCardData(prompt.trim())];

      if (results && results.length > 0) {
        setGeneratedCards(results);
        setSelectedIndices(new Set(results.map((_, i) => i)));
        triggerHaptic("success");
      } else {
        setErrorMessage("AI không tạo được từ vựng từ từ khóa này. Vui lòng thử từ khóa khác.");
        triggerHaptic("error");
      }
    } catch (err: unknown) {
      setErrorMessage(getGeminiErrorMessage(err));
      triggerHaptic("error");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

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
      await Promise.all(
        cardsToSave.map((cardData) =>
          addCard({
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
          }),
        ),
      );

      triggerHaptic("success");
      if (onClose) onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "Không thể lưu từ vựng vào bộ thẻ.");
      triggerHaptic("error");
    } finally {
      setLoading(false);
    }
  }, [selectedDeckId, generatedCards, selectedIndices, addCard, onClose]);

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
