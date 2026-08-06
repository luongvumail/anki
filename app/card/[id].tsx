import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { useAppStore } from "../../src/ui/store/useAppStore";
import { isDue } from "../../src/domain/card/cardUtils";
import { getPinyinToneColor } from "../../src/ui/utils/pinyinColor";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { AudioButton } from "../../components/ui/AudioButton";
import { GeminiService } from "../../src/infrastructure/ai/geminiService";

const geminiService = new GeminiService();

export default function CardDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, deckId } = useLocalSearchParams<{ id: string; deckId: string }>();
  const cards = useAppStore((s) => s.cards);
  const deleteCard = useAppStore((s) => s.deleteCard);
  const updateCard = useAppStore((s) => s.updateCard);
  const [speaking, setSpeaking] = useState(false);
  const [generatingRadical, setGeneratingRadical] = useState(false);

  const card = useMemo(() => {
    const deckCards = cards[deckId] || [];
    return deckCards.find((c) => c.id === id);
  }, [cards, deckId, id]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleDelete = () => {
    if (!card) return;
    Alert.alert("Xóa thẻ vựng", `Bạn có chắc chắn muốn xóa từ "${card.character}" khỏi bộ thẻ?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa thẻ",
        style: "destructive",
        onPress: async () => {
          triggerHaptic("heavy");
          await deleteCard(card.id, deckId);
          router.back();
        },
      },
    ]);
  };

  const speak = () => {
    if (!card) return;
    setSpeaking(true);
    Speech.speak(card.character, {
      language: "zh-CN",
      rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const handleGenerateRadical = async () => {
    if (!card || generatingRadical) return;
    try {
      setGeneratingRadical(true);
      triggerHaptic("light");
      const radical = await geminiService.generateRadical(card.character);
      if (radical && radical.trim().length > 0) {
        await updateCard(card.id, deckId, { radical });
        triggerHaptic("success");
      } else {
        Alert.alert("Thông báo", "AI không thể phân tích bộ thủ cho từ này. Vui lòng thử lại.");
      }
    } catch (e) {
      console.warn("[generateRadical]", e);
      Alert.alert("Lỗi", "Không thể kết nối AI. Vui lòng kiểm tra kết nối mạng và thử lại.");
    } finally {
      setGeneratingRadical(false);
    }
  };

  if (!card) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.duolingo.blue} />
      </View>
    );
  }

  const pinyinColor = getPinyinToneColor(card.pinyin);

  return (
    <View style={styles.container}>
      {/* Clean Sub-screen Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CHI TIẾT TỪ VỰNG</Text>

        {/* Empty placeholder to balance header title centering */}
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 40, 60) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Flashcard Hero Banner */}
        <DuolingoCard style={styles.heroCard}>
          <Text style={styles.characterBig}>{card.character}</Text>
          {card.traditional && card.traditional !== card.character ? (
            <Text style={styles.traditionalText}>Phồn thể: {card.traditional}</Text>
          ) : null}

          <View style={styles.pinyinAudioRow}>
            <Text style={styles.pinyinBig}>{card.pinyin}</Text>
            <AudioButton onPress={speak} isPlaying={speaking} size="md" />
          </View>

          <Text style={styles.translationBig}>{card.translation}</Text>
        </DuolingoCard>

        {/* Radical Breakdown Section */}
        {card.radical ? (
          <DuolingoCard style={styles.radicalCard}>
            <View style={styles.radicalRow}>
              <Ionicons
                name="layers-outline"
                size={18}
                color={Colors.duolingo.purple}
                style={{ marginTop: 2 }}
              />
              <Text style={styles.radicalContent}>{card.radical}</Text>
            </View>
          </DuolingoCard>
        ) : (
          <DuolingoCard style={styles.radicalCard}>
            <View style={styles.radicalHeader}>
              <View style={styles.radicalHeaderLeft}>
                <Ionicons name="layers-outline" size={18} color={Colors.duolingo.textMuted} />
                <Text style={[styles.radicalHeaderTitle, { color: Colors.duolingo.textMuted }]}>
                  CẤU TẠO BỘ THỦ & MẸO NHỚ
                </Text>
              </View>
            </View>
            <Text style={styles.radicalEmpty}>
              Thẻ này chưa có phân tích bộ thủ. Nhấn bên dưới để AI phân tích chiết tự ngay!
            </Text>
            <DuolingoButton
              title={generatingRadical ? "ĐANG PHÂN TÍCH..." : "PHÂN TÍCH BỘ THỦ BẰNG AI"}
              variant="purple"
              size="md"
              disabled={generatingRadical}
              onPress={handleGenerateRadical}
              style={{ marginTop: Spacing.sm }}
              icon={
                generatingRadical ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                )
              }
            />
          </DuolingoCard>
        )}

        {/* FSRS v5 Learning Status Card */}
        <SectionTitle>TRẠNG THÁI TRÍ NHỚ (FSRS v5)</SectionTitle>
        <DuolingoCard style={styles.detailCard}>
          {(() => {
            const fsrs = (card as any).fsrs || { stability: 0, difficulty: 5, reps: card.srs?.repetitions || 0, lapses: 0, due: card.srs?.dueDate || new Date().toISOString() };
            return (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái hiện tại</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isDue({ due: fsrs.due })
                          ? Colors.duolingo.red
                          : fsrs.reps > 0
                            ? Colors.duolingo.green
                            : Colors.duolingo.blue,
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {isDue({ due: fsrs.due }) ? "CẦN ÔN TẬP" : fsrs.reps > 0 ? "ĐÃ THUỘC" : "TỪ MỚI"}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailRow, styles.borderTop]}>
                  <Text style={styles.detailLabel}>Độ ổn định (Stability - S)</Text>
                  <Text style={styles.detailVal}>{fsrs.stability ? `${fsrs.stability} ngày` : 'Mới'}</Text>
                </View>

                <View style={[styles.detailRow, styles.borderTop]}>
                  <Text style={styles.detailLabel}>Độ khó (Difficulty - D)</Text>
                  <Text style={styles.detailVal}>
                    {fsrs.difficulty ? `${fsrs.difficulty}/10` : '5/10'}
                  </Text>
                </View>

                <View style={[styles.detailRow, styles.borderTop]}>
                  <Text style={styles.detailLabel}>Số lần ôn / Số lần quên</Text>
                  <Text style={styles.detailVal}>{fsrs.reps || 0} lần / {fsrs.lapses || 0} lần</Text>
                </View>
              </>
            );
          })()}
        </DuolingoCard>

        {/* Example Sentences */}
        {card.examples && card.examples.length > 0 ? (
          <>
            <SectionTitle>CÂU VÍ DỤ MINH HỌA</SectionTitle>
            {card.examples.map((ex, idx) => (
              <DuolingoCard key={idx} style={styles.exampleCard}>
                <Text style={styles.exampleCn}>{ex.chinese}</Text>
                {ex.pinyin ? <Text style={styles.examplePy}>{ex.pinyin}</Text> : null}
                <Text style={styles.exampleVi}>{ex.vietnamese}</Text>
              </DuolingoCard>
            ))}
          </>
        ) : null}

        {/* Delete Button */}
        <DuolingoButton
          title="XÓA THẺ TỪ VỰNG NÀY"
          variant="error"
          size="lg"
          onPress={handleDelete}
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>
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
  backBtn: { padding: 4, width: 32 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.white,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerPlaceholder: { width: 32 },

  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },

  heroCard: { padding: Spacing.xl, alignItems: "center", marginBottom: Spacing.lg },
  characterBig: { fontSize: 64, fontWeight: "800", color: Colors.text.white },
  traditionalText: { fontSize: 13, color: Colors.duolingo.textMuted, marginTop: 2 },
  pinyinAudioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: Spacing.xs,
  },
  pinyinBig: { fontSize: 24, fontWeight: "800", color: Colors.duolingo.blue },
  speakerAudioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.duolingo.blueDim,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  translationBig: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.duolingo.green,
    marginTop: 6,
    textAlign: "center",
  },

  detailCard: { padding: Spacing.md, marginBottom: Spacing.lg },

  radicalCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  radicalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  radicalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  radicalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  radicalHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.purple,
  },
  regenBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.duolingo.purpleDim,
    alignItems: "center",
    justifyContent: "center",
  },
  radicalContent: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.white,
    fontWeight: "600",
    lineHeight: 22,
  },
  radicalEmpty: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    lineHeight: 20,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  borderTop: { borderTopWidth: 1, borderTopColor: Colors.duolingo.cardBorder },
  detailLabel: { fontSize: 14, color: Colors.duolingo.textMuted, fontWeight: "600" },
  detailVal: { fontSize: 14, fontWeight: "800", color: Colors.text.white },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.text.white,
  },

  exampleCard: { padding: Spacing.md, marginBottom: 10 },
  exampleCn: { fontSize: 16, fontWeight: "800", color: Colors.text.white },
  examplePy: { fontSize: 13, marginTop: 2, fontWeight: "600", color: Colors.duolingo.blue },
  exampleVi: { fontSize: 13, color: Colors.duolingo.textMuted, marginTop: 2 },
});
