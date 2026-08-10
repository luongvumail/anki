import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CardEntity } from "../../domain/card/cardEntity.js";
import { geminiService } from "../../infrastructure/ai/geminiService.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { BadgeVariant, StatusBadge } from "../components/StatusBadge.js";
import { theme } from "../theme/theme.js";
import { appStore } from "../store/useAppStore.js";

export interface CardDetailScreenProps {
  cardId: string;
  deckId: string;
  onBack: () => void;
}

export const CardDetailScreen: React.FC<CardDetailScreenProps> = ({ cardId, deckId, onBack }) => {
  const [card, setCard] = useState<CardEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [analyzingRadical, setAnalyzingRadical] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    appStore.fetchCards(deckId).then(() => {
      if (!isMounted) return;
      const allCards = appStore.getState().cards[deckId] || [];
      const found = allCards.find((c) => c.id === cardId);
      setCard(found || null);
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [cardId, deckId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Đang tải chi tiết thẻ...</Text>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundTitle}>Không tìm thấy thẻ vựng này</Text>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Icon name="decks" size={18} color={theme.colors.primary} />
          <Text style={styles.backBtnText}>Quay lại danh sách</Text>
        </Pressable>
      </View>
    );
  }

  const speakHanzi = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.kanji);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleGenerateRadical = async () => {
    setAnalyzingRadical(true);
    try {
      const radicalInfo = await geminiService.generateRadical(card.kanji);
      await appStore.updateCard(card.id, deckId, { radicalAnalysis: radicalInfo });
      setCard((prev) => (prev ? { ...prev, radicalAnalysis: radicalInfo } : null));
    } catch (e) {
      Alert.alert("Lỗi", "Không thể phân tích bộ thủ lúc này. Vui lòng thử lại!");
    } finally {
      setAnalyzingRadical(false);
    }
  };

  const handleDeleteCard = () => {
    Alert.alert("Xác nhận xóa", `Bạn có chắc muốn xóa thẻ "${card.kanji}" khỏi bộ học?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await appStore.deleteCard(card.id, deckId);
          onBack();
        },
      },
    ]);
  };

  const fsrs = card.fsrsState || {
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    due: new Date().toISOString(),
  };

  const isDueNow = new Date(fsrs.due).getTime() <= Date.now();
  const getStatusBadgeInfo = (): { variant: BadgeVariant; text: string } => {
    if (isDueNow) {
      return { variant: "due", text: "CẦN ÔN NGAY" };
    }
    if (fsrs.reps > 0) {
      return { variant: "learned", text: "ĐÃ GHI NHỚ" };
    }
    return { variant: "new", text: "TỪ MỚI" };
  };

  const badgeInfo = getStatusBadgeInfo();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Bar */}
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Icon name="decks" size={18} color={theme.colors.primary} />
          <Text style={styles.backBtnText}>Quay lại danh sách từ</Text>
        </Pressable>

        {/* Hero Card */}
        <DuolingoCard accessibilityLabel={`Chi tiết thẻ ${card.kanji}`}>
          <View style={styles.heroBox}>
            <Text style={styles.heroKanji}>{card.kanji}</Text>

            <View style={styles.audioRow}>
              <Text style={styles.pinyinText}>{card.pinyin}</Text>
              <Pressable
                onPress={speakHanzi}
                style={[
                  styles.audioBtn,
                  {
                    backgroundColor: speaking ? theme.colors.primary : theme.badges.neutral.bg,
                  },
                ]}
              >
                <Icon name="audio" size={20} color={speaking ? theme.colors.white : theme.colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.meaningText}>{card.meaning}</Text>

            {card.exampleSentence && (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleText}>"{card.exampleSentence}"</Text>
              </View>
            )}
          </View>
        </DuolingoCard>

        {/* Radical Breakdown Section */}
        <View style={styles.sectionMargin}>
          <DuolingoCard accessibilityLabel="Cấu tạo bộ thủ">
            <View style={styles.sectionHeader}>
              <Icon name="layers" size={20} color={theme.colors.secondary} />
              <Text style={styles.sectionTitle}>CẤU TẠO BỘ THỦ & CHIẾT TỰ</Text>
            </View>

            {card.radicalAnalysis ? (
              <Text style={styles.radicalText}>{card.radicalAnalysis}</Text>
            ) : (
              <View>
                <Text style={styles.emptyText}>
                  Thẻ này chưa có phân tích bộ thủ. Nhấn bên dưới để AI chiết tự ngay!
                </Text>
                <DuolingoButton
                  title={analyzingRadical ? "ĐANG PHÂN TÍCH AI..." : "PHÂN TÍCH BỘ THỦ BẰNG AI"}
                  variant="primary"
                  disabled={analyzingRadical}
                  onPress={handleGenerateRadical}
                />
              </View>
            )}
          </DuolingoCard>
        </View>

        {/* FSRS v5 Memory Status Card */}
        <View style={styles.sectionMargin}>
          <DuolingoCard accessibilityLabel="Trạng thái trí nhớ FSRS v5">
            <View style={styles.fsrsHeader}>
              <View style={styles.sectionHeader}>
                <Icon name="brain" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>TRẠNG THÁI TRÍ NHỚ (FSRS v5)</Text>
              </View>
              <StatusBadge variant={badgeInfo.variant} label={badgeInfo.text} />
            </View>

            <View style={styles.grid2}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Độ bền trí nhớ (Stability):</Text>
                <Text style={styles.statValue}>
                  {fsrs.stability ? `${fsrs.stability.toFixed(1)} ngày` : "Mới"}
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Độ khó (Difficulty):</Text>
                <Text style={styles.statValue}>
                  {fsrs.difficulty ? fsrs.difficulty.toFixed(1) : "5.0"} / 10
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Số lần lặp (Reps):</Text>
                <Text style={styles.statValue}>{fsrs.reps} lần</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Lần quên (Lapses):</Text>
                <Text style={[styles.statValue, { color: theme.colors.danger }]}>
                  {fsrs.lapses} lần
                </Text>
              </View>
            </View>

            <View style={styles.dueRow}>
              <Text style={styles.dueLabel}>Ngày đến hạn ôn tập:</Text>
              <Text style={styles.dueValue}>{new Date(fsrs.due).toLocaleDateString("vi-VN")}</Text>
            </View>
          </DuolingoCard>
        </View>

        {/* Delete Card Button */}
        <View style={styles.deleteSection}>
          <Pressable style={styles.deleteOutlineBtn} onPress={handleDeleteCard}>
            <Icon name="trash" size={18} color={theme.colors.danger} />
            <Text style={styles.deleteOutlineText}>XÓA THẺ VỰNG NÀY</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  notFoundTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
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
  heroBox: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  heroKanji: {
    fontSize: theme.fontSize.hero,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  pinyinText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  audioBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  meaningText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
  },
  exampleBox: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginTop: theme.spacing.lg,
    width: "100%",
  },
  exampleText: {
    fontSize: theme.fontSize.sm,
    fontStyle: "italic",
    color: theme.colors.textSecondary,
  },
  sectionMargin: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  radicalText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.base,
    lineHeight: 22,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  fsrsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statBox: {
    width: "47%",
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  dueLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  dueValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  deleteSection: {
    marginTop: theme.spacing.xl,
  },
  deleteOutlineBtn: {
    width: "100%",
    backgroundColor: theme.badges.due.bg,
    borderColor: theme.colors.danger,
    borderWidth: 2,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  deleteOutlineText: {
    color: theme.colors.danger,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.base,
  },
});
