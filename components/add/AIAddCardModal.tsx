import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { DuolingoCard } from "../ui/DuolingoCard";
import { DeckPicker } from "./DeckPicker";
import { CardPreview } from "./CardPreview";
import { useAICardGenerator } from "../../hooks/useAICardGenerator";

export interface AIAddCardModalProps {
  visible: boolean;
  onClose: () => void;
  initialDeckId?: string;
}

export function AIAddCardModal({
  visible,
  onClose,
  initialDeckId,
}: AIAddCardModalProps) {
  const insets = useSafeAreaInsets();
  const {
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
  } = useAICardGenerator(initialDeckId, onClose);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              triggerHaptic("selection");
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color={Colors.duolingo.textMuted} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>THÊM TỪ VỰNG BẰNG AI</Text>
            <Text style={styles.headerSub}>Tự động tạo Pinyin, Nghĩa &amp; Ví dụ</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Deck Picker */}
          <DeckPicker
            decks={decks}
            selectedDeckId={selectedDeckId}
            isOpen={isDeckPickerOpen}
            onToggleOpen={() => setIsDeckPickerOpen((v) => !v)}
            onSelectDeck={setSelectedDeckId}
          />

          {/* AI Prompt Input Section */}
          <DuolingoCard style={styles.inputCard}>
            <Text style={styles.inputLabel}>Nhập từ Hán, Pinyin hoặc chủ đề:</Text>
            <TextInput
              style={styles.promptInput}
              placeholder="Ví dụ: 苹果, Du lịch, Ăn uống, HSK 3..."
              placeholderTextColor={Colors.duolingo.disabledText}
              value={prompt}
              onChangeText={setPrompt}
              autoCapitalize="none"
            />

            <DuolingoButton
              title={loading ? "AI ĐANG TẠO..." : "TAO TỪ VỰNG BẰNG AI"}
              variant="purple"
              size="lg"
              disabled={loading || !prompt.trim()}
              onPress={handleGenerate}
              style={{ marginTop: Spacing.md }}
              icon={
                loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                )
              }
            />
          </DuolingoCard>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.duolingo.red} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Generated Cards Result List */}
          {generatedCards.length > 0 && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>
                Kết quả AI ({selectedIndices.size}/{generatedCards.length} từ chọn):
              </Text>

              {generatedCards.map((card, idx) => (
                <CardPreview
                  key={idx}
                  cardData={card}
                  onRemove={() => toggleSelectCard(idx)}
                />
              ))}

              <DuolingoButton
                title={`NẠP ${selectedIndices.size} TỪ VÀO BỘ THẺ`}
                variant="primary"
                size="lg"
                disabled={loading || selectedIndices.size === 0}
                onPress={handleSaveSelected}
                style={{ marginTop: Spacing.md }}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: 10,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.white,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  scrollBody: {
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: 30,
  },
  inputCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.duolingo.textMuted,
    marginBottom: 8,
  },
  promptInput: {
    backgroundColor: Colors.duolingo.bgSoftDark,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.white,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 75, 75, 0.15)",
    padding: 12,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: Colors.duolingo.red,
    flex: 1,
    fontWeight: "600",
  },
  resultSection: {
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text.white,
    marginBottom: 10,
  },
});
