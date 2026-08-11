import React, { useState } from "react";
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
import { CardData, GeminiService } from "../../infrastructure/ai/geminiService.js";
import { useTheme } from "../theme/ThemeContext.js";
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
  const { theme } = useTheme();
  const [storeState, setStoreState] = useState(appStore.getState());
  const decks = storeState.decks;
  const cards = storeState.cards;

  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    () => initialDeckId || defaultDeckId || decks[0]?.id || "",
  );
  const [inputWords, setInputWords] = useState<string>("");
  const [wordItems, setWordItems] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Inline deck creation state
  const [newDeckTitle, setNewDeckTitle] = useState<string>("");
  const [newDeckDesc, setNewDeckDesc] = useState<string>("");
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);

  React.useEffect(() => {
    const unsub = appStore.subscribe(() => {
      const state = appStore.getState();
      setStoreState(state);
      if (state.decks.length > 0 && !selectedDeckId) {
        setSelectedDeckId(state.decks[0].id);
      }
    });
    return unsub;
  }, [selectedDeckId]);

  if (!visible) return null;

  const handleCreateDeckInline = async () => {
    if (!newDeckTitle.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập tên bộ thẻ mới.");
      return;
    }
    setIsCreatingDeck(true);
    try {
      const created = await appStore.addDeck(newDeckTitle.trim(), newDeckDesc.trim());
      setSelectedDeckId(created.id);
      setNewDeckTitle("");
      setNewDeckDesc("");
      Alert.alert("Thành công", `Đã tạo bộ thẻ "${created.title}"! Giờ bạn có thể thêm từ AI.`);
    } catch (e: any) {
      Alert.alert("Lỗi tạo bộ thẻ", e.message || "Không thể tạo bộ thẻ lúc này.");
    } finally {
      setIsCreatingDeck(false);
    }
  };

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
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.fullModalContainer, { backgroundColor: theme.colors.bg }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            TẠO THẺ TỪ VỰNG AI
          </Text>
        </View>

        <ScrollView style={styles.scrollContent}>
          {decks.length === 0 ? (
            <DuolingoCard accessibilityLabel="Cần tạo bộ thẻ trước">
              <View style={styles.noDeckBox}>
                <Icon name="sparkles" size={40} color={theme.colors.secondary} />
                <Text style={[styles.noDeckTitle, { color: theme.colors.textPrimary }]}>
                  BẠN CHƯA CÓ BỘ THẺ NÀO
                </Text>
                <Text style={[styles.noDeckSubtitle, { color: theme.colors.textSecondary }]}>
                  Để tạo từ vựng bằng AI, hãy tạo bộ thẻ mới đầu tiên làm mục tiêu lưu trữ từ vựng!
                </Text>

                <View style={styles.inlineCreateForm}>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.cardBg, color: theme.colors.textPrimary },
                    ]}
                    value={newDeckTitle}
                    onChangeText={setNewDeckTitle}
                    placeholder="Tên bộ thẻ mới (ví dụ: Từ vựng HSK1)"
                    placeholderTextColor={theme.colors.textLight}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.cardBg, color: theme.colors.textPrimary },
                    ]}
                    value={newDeckDesc}
                    onChangeText={setNewDeckDesc}
                    placeholder="Mô tả bộ thẻ (tùy chọn)"
                    placeholderTextColor={theme.colors.textLight}
                  />
                  <DuolingoButton
                    title={isCreatingDeck ? "ĐANG TẠO..." : "+ TẠO BỘ THẺ MỚI"}
                    variant="primary"
                    disabled={isCreatingDeck || !newDeckTitle.trim()}
                    onPress={handleCreateDeckInline}
                  />
                </View>
              </View>
            </DuolingoCard>
          ) : (
            <>
              <View style={styles.section}>
                <DeckPicker
                  decks={decks}
                  selectedDeckId={selectedDeckId}
                  onSelectDeck={setSelectedDeckId}
                />
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  NHẬP CÁC TỪ VỰNG HÁN TỰ (Phân cách bởi dấu phẩy hoặc xuống dòng)
                </Text>
                <TextInput
                  multiline
                  numberOfLines={3}
                  value={inputWords}
                  onChangeText={setInputWords}
                  placeholder="Ví dụ: 学习, 苹果, 喝, 茶"
                  placeholderTextColor={theme.colors.textLight}
                  style={[
                    styles.textarea,
                    {
                      backgroundColor: theme.colors.cardBg,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                />
              </View>

              {notice && (
                <View style={[styles.noticeBox, { backgroundColor: theme.badges.warning.bg }]}>
                  <Text style={[styles.noticeText, { color: theme.colors.secondary }]}>{notice}</Text>
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
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                    KẾT QUẢ XEM TRƯỚC
                  </Text>
                  {wordItems.map((item, idx) => (
                    <View key={idx} style={styles.previewCardWrapper}>
                      {item.data ? (
                        <CardPreview
                          cardData={item.data}
                          onRemove={() => setWordItems((prev) => prev.filter((_, i) => i !== idx))}
                          onUpdate={(updatedData) =>
                            setWordItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, data: updatedData } : it)),
                            )
                          }
                        />
                      ) : (
                        <DuolingoCard accessibilityLabel={`Đang xử lý ${item.word}`}>
                          <Text style={[styles.loadingWord, { color: theme.colors.textSecondary }]}>
                            Đang tạo thẻ cho từ: {item.word}...
                          </Text>
                        </DuolingoCard>
                      )}
                    </View>
                  ))}

                  <DuolingoButton
                    title={isSaving ? "ĐANG LƯU..." : `LƯU VÀO BỘ THẺ (${wordItems.length} THẺ)`}
                    variant="primary"
                    disabled={isSaving}
                    onPress={handleSaveAll}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullModalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  textarea: {
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    minHeight: 90,
    textAlignVertical: "top",
  },
  noticeBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  previewCardWrapper: {
    marginBottom: 12,
  },
  loadingWord: {
    fontSize: 14,
  },
  noDeckBox: {
    alignItems: "center",
    paddingVertical: 16,
  },
  noDeckTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  noDeckSubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  inlineCreateForm: {
    width: "100%",
    gap: 10,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    padding: 12,
    fontSize: 14,
  },
});
