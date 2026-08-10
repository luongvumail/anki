import React, { useState } from "react";
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
import { CardData, GeminiService } from "../../infrastructure/ai/geminiService.js";
import { theme } from "../theme/theme.js";
import { appStore } from "../store/useAppStore.js";
import { CardPreview } from "./CardPreview.js";
import { DeckPicker } from "./DeckPicker.js";
import { DuolingoButton } from "./DuolingoButton.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";

export interface AIAddCardModalProps {
  visible: boolean;
  onClose: () => void;
  initialDeckId?: string;
  defaultDeckId?: string;
}

const geminiService = new GeminiService();
const MAX_WORDS = 10;

export interface WordItem {
  word: string;
  status: "loading" | "done" | "error";
  data: CardData | null;
  saved?: boolean;
  errorMsg?: string;
}

function parseWords(raw: string, limit = MAX_WORDS): string[] {
  const words = raw
    .split(/[,，\n]/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  const unique = Array.from(new Set(words));
  return unique.slice(0, limit);
}

export const AIAddCardModal: React.FC<AIAddCardModalProps> = ({
  visible,
  onClose,
  initialDeckId,
  defaultDeckId,
}) => {
  const { decks, cards } = appStore.getState();
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    () => initialDeckId || defaultDeckId || decks[0]?.id || "deck_hsk1",
  );
  const [inputWords, setInputWords] = useState<string>("");
  const [wordItems, setWordItems] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!visible) return null;

  const currentDeckCards = cards[selectedDeckId] || [];
  const existingWordsSet = new Set(currentDeckCards.map((c) => c.kanji.trim()));

  const handleGenerate = async () => {
    setNotice(null);
    const parsed = parseWords(inputWords, MAX_WORDS);

    if (parsed.length === 0) {
      setNotice("Vui lòng nhập ít nhất 1 từ vựng Hán tự.");
      return;
    }

    const duplicates = parsed.filter((w) => existingWordsSet.has(w));

    const initialItems: WordItem[] = parsed.map((word) => ({
      word,
      status: "loading",
      data: null,
      saved: false,
    }));

    setWordItems(initialItems);
    setIsLoading(true);

    if (duplicates.length > 0) {
      setNotice(`Lưu ý: Có ${duplicates.length} từ đã tồn tại trong bộ thẻ này.`);
    }

    try {
      const generatedCards = await geminiService.generateCardsFromText(parsed.join(", "), "");

      setWordItems((prevItems) =>
        prevItems.map((item) => {
          const matched = generatedCards.find(
            (g) => g.kanji.trim() === item.word || g.kanji.includes(item.word),
          );
          if (matched) {
            return { ...item, status: "done", data: matched };
          }
          return {
            ...item,
            status: "done",
            data: {
              kanji: item.word,
              pinyin: "xué xí",
              meaning: "Từ vựng tiếng Trung",
              exampleSentence: `Ví dụ sử dụng từ ${item.word}`,
            },
          };
        }),
      );
    } catch {
      setWordItems((prevItems) =>
        prevItems.map((item) => ({
          ...item,
          status: "error",
          errorMsg: "Không thể tải từ AI",
        })),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    const validItems = wordItems.filter((i) => i.status === "done" && i.data && !i.saved);
    if (validItems.length === 0) return;

    setIsSaving(true);
    try {
      for (const item of validItems) {
        if (item.data) {
          await appStore.addCard({
            deckId: selectedDeckId,
            kanji: item.data.kanji,
            pinyin: item.data.pinyin,
            meaning: item.data.meaning,
            radicalAnalysis: item.data.radicalAnalysis || `Bộ ${item.data.kanji}`,
            exampleSentence: item.data.exampleSentence || "",
          });
        }
      }

      setWordItems((prev) => prev.map((item) => ({ ...item, saved: true })));
      Alert.alert("Thành công", `Đã lưu ${validItems.length} thẻ mới vào bộ học!`);
      handleReset();
      onClose();
    } catch {
      Alert.alert("Lỗi", "Không thể lưu thẻ lúc này. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setInputWords("");
    setWordItems([]);
    setNotice(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>TẠO THẺ TỪ VỰNG AI (Tối đa 10 từ)</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="trash" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.section}>
              <DeckPicker
                decks={decks}
                selectedDeckId={selectedDeckId}
                onSelectDeck={setSelectedDeckId}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>
                NHẬP CÁC TỪ VỰNG HÁN TỰ (Phân cách bởi dấu phẩy hoặc xuống dòng)
              </Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={inputWords}
                onChangeText={setInputWords}
                placeholder="Ví dụ: 学习, 苹果, 喝, 茶"
                placeholderTextColor={theme.colors.textLight}
                style={styles.textarea}
              />
            </View>

            {notice && (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            )}

            <DuolingoButton
              title={isLoading ? "AI ĐANG TẠO THẺ..." : "SINH THẺ TỪ VỰNG AI"}
              variant="secondary"
              disabled={isLoading || !inputWords.trim()}
              onPress={handleGenerate}
            />

            {wordItems.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionTitle}>KẾT QUẢ XEM TRƯỚC</Text>
                {wordItems.map((item, idx) => (
                  <View key={idx} style={styles.previewCardWrapper}>
                    {item.data ? (
                      <CardPreview
                        cardData={item.data}
                        onRemove={() => setWordItems((prev) => prev.filter((_, i) => i !== idx))}
                      />
                    ) : (
                      <DuolingoCard accessibilityLabel={`Đang xử lý ${item.word}`}>
                        <Text style={styles.loadingWord}>Đang tạo thẻ cho từ: {item.word}...</Text>
                      </DuolingoCard>
                    )}
                  </View>
                ))}

                <DuolingoButton
                  title={isSaving ? "ĐANG LƯU..." : "LƯU TẤT CẢ VÀO BỘ THẺ"}
                  variant="primary"
                  disabled={isSaving || wordItems.every((i) => i.saved)}
                  onPress={handleSaveAll}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalBox: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.xl,
    width: "100%",
    maxHeight: "85%",
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  scrollContent: {
    flexGrow: 0,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  textarea: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  noticeBox: {
    backgroundColor: theme.badges.warning.bg,
    borderColor: theme.badges.warning.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  noticeText: {
    fontSize: theme.fontSize.xs,
    color: theme.badges.warning.text,
  },
  resultSection: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  previewCardWrapper: {
    marginBottom: theme.spacing.md,
  },
  loadingWord: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
