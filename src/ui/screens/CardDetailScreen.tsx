import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Speech from "expo-speech";
import { CardEntity } from "../../domain/card/cardEntity.js";
import { geminiService } from "../../infrastructure/ai/geminiService.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { BadgeVariant, StatusBadge } from "../components/StatusBadge.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { appStore } from "../store/useAppStore.js";

export interface CardDetailScreenProps {
  cardId: string;
  deckId: string;
  onBack: () => void;
}

export const CardDetailScreen: React.FC<CardDetailScreenProps> = ({ cardId, deckId, onBack }) => {
  const { theme: activeTheme } = useTheme();
  const [card, setCard] = useState<CardEntity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [analyzingRadical, setAnalyzingRadical] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editKanji, setEditKanji] = useState<string>("");
  const [editPinyin, setEditPinyin] = useState<string>("");
  const [editMeaning, setEditMeaning] = useState<string>("");
  const [editExample, setEditExample] = useState<string>("");

  const handleOpenEdit = () => {
    if (!card) return;
    setEditKanji(card.kanji);
    setEditPinyin(card.pinyin);
    setEditMeaning(card.meaning);
    setEditExample(card.exampleSentence || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!card || !editKanji.trim()) return;
    try {
      const updates = {
        kanji: editKanji.trim(),
        pinyin: editPinyin.trim(),
        meaning: editMeaning.trim(),
        exampleSentence: editExample.trim(),
      };
      await appStore.updateCard(card.id, deckId, updates);
      setCard((prev) => (prev ? { ...prev, ...updates } : null));
      setShowEditModal(false);
      Alert.alert("Thành công", "Đã cập nhật thông tin thẻ!");
    } catch {
      Alert.alert("Lỗi", "Không thể lưu thay đổi lúc này.");
    }
  };

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

  const [nowMs] = useState<number>(() => Date.now());

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
    if (!card) return;
    Speech.stop();
    setSpeaking(true);
    Speech.speak(card.kanji, {
      language: "zh-CN",
      rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const handleGenerateRadical = async () => {
    setAnalyzingRadical(true);
    try {
      const radicalInfo = await geminiService.generateRadical(card.kanji);
      await appStore.updateCard(card.id, deckId, { radicalAnalysis: radicalInfo });
      setCard((prev) => (prev ? { ...prev, radicalAnalysis: radicalInfo } : null));
    } catch {
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

  const isDueNow = new Date(fsrs.due).getTime() <= nowMs;
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
            <Text style={[styles.heroKanji, { color: activeTheme.colors.textPrimary }]}>
              {card.kanji}
            </Text>

            <View style={styles.audioRow}>
              <Text style={[styles.pinyinText, { color: activeTheme.colors.primary }]}>
                {card.pinyin}
              </Text>
              <Pressable
                onPress={speakHanzi}
                style={[
                  styles.audioBtn,
                  {
                    backgroundColor: speaking ? activeTheme.colors.primary : activeTheme.badges.neutral.bg,
                  },
                ]}
              >
                <Icon
                  name="audio"
                  size={20}
                  color={speaking ? activeTheme.colors.white : activeTheme.colors.textPrimary}
                />
              </Pressable>
            </View>

            <Text style={[styles.meaningText, { color: activeTheme.colors.textSecondary }]}>
              {card.meaning}
            </Text>

            {card.exampleSentence && (
              <View style={[styles.exampleBox, { backgroundColor: activeTheme.colors.bg }]}>
                <Text style={[styles.exampleText, { color: activeTheme.colors.textSecondary }]}>
                  "{card.exampleSentence}"
                </Text>
              </View>
            )}
          </View>
        </DuolingoCard>

        {/* Radical Breakdown Section */}
        <View style={styles.sectionMargin}>
          <DuolingoCard accessibilityLabel="Cấu tạo bộ thủ">
            <View style={styles.sectionHeader}>
              <Icon name="layers" size={20} color={activeTheme.colors.secondary} />
              <Text style={[styles.sectionTitle, { color: activeTheme.colors.textPrimary }]}>
                CẤU TẠO BỘ THỦ & CHIẾT TỰ
              </Text>
            </View>

            {card.radicalAnalysis ? (
              <Text style={[styles.radicalText, { color: activeTheme.colors.textSecondary }]}>
                {card.radicalAnalysis}
              </Text>
            ) : (
              <View>
                <Text style={[styles.emptyText, { color: activeTheme.colors.textSecondary }]}>
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
                <Icon name="brain" size={20} color={activeTheme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: activeTheme.colors.textPrimary }]}>
                  TRẠNG THÁI TRÍ NHỚ (FSRS v5)
                </Text>
              </View>
              <StatusBadge variant={badgeInfo.variant} label={badgeInfo.text} />
            </View>

            <View style={styles.grid2}>
              <View style={[styles.statBox, { backgroundColor: activeTheme.colors.bg }]}>
                <Text style={[styles.statLabel, { color: activeTheme.colors.textSecondary }]}>
                  Độ bền trí nhớ (Stability):
                </Text>
                <Text style={[styles.statValue, { color: activeTheme.colors.textPrimary }]}>
                  {fsrs.stability ? `${fsrs.stability.toFixed(1)} ngày` : "Mới"}
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: activeTheme.colors.bg }]}>
                <Text style={[styles.statLabel, { color: activeTheme.colors.textSecondary }]}>
                  Độ khó (Difficulty):
                </Text>
                <Text style={[styles.statValue, { color: activeTheme.colors.textPrimary }]}>
                  {fsrs.difficulty ? fsrs.difficulty.toFixed(1) : "5.0"} / 10
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: activeTheme.colors.bg }]}>
                <Text style={[styles.statLabel, { color: activeTheme.colors.textSecondary }]}>
                  Số lần lặp (Reps):
                </Text>
                <Text style={[styles.statValue, { color: activeTheme.colors.textPrimary }]}>
                  {fsrs.reps} lần
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: activeTheme.colors.bg }]}>
                <Text style={[styles.statLabel, { color: activeTheme.colors.textSecondary }]}>
                  Lần quên (Lapses):
                </Text>
                <Text style={[styles.statValue, { color: activeTheme.colors.danger }]}>
                  {fsrs.lapses} lần
                </Text>
              </View>
            </View>

            <View style={[styles.dueRow, { borderTopColor: activeTheme.colors.cardBorder }]}>
              <Text style={[styles.dueLabel, { color: activeTheme.colors.textSecondary }]}>
                Ngày đến hạn ôn tập:
              </Text>
              <Text style={[styles.dueValue, { color: activeTheme.colors.textPrimary }]}>
                {new Date(fsrs.due).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          </DuolingoCard>
        </View>

        {/* Action Buttons: Edit & Delete */}
        <View style={styles.actionRow}>
          <Pressable style={styles.editOutlineBtn} onPress={handleOpenEdit}>
            <Icon name="wrench" size={18} color={theme.colors.primary} />
            <Text style={styles.editOutlineText}>CHỈNH SỬA THẺ</Text>
          </Pressable>

          <Pressable style={styles.deleteOutlineBtn} onPress={handleDeleteCard}>
            <Icon name="trash" size={18} color={theme.colors.danger} />
            <Text style={styles.deleteOutlineText}>XÓA THẺ</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Card Modal */}
      {showEditModal && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={[styles.fullModalContainer, { backgroundColor: activeTheme.colors.bg }]}>
            <View style={styles.fullModalHeader}>
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={styles.closeBtn}
                accessibilityLabel="Đóng chỉnh sửa"
              >
                <Icon name="close" size={24} color={activeTheme.colors.textPrimary} />
              </Pressable>
              <Text style={[styles.fullModalTitle, { color: activeTheme.colors.textPrimary }]}>
                Chỉnh Sửa Từ Vựng
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.fullModalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: activeTheme.colors.textSecondary }]}>
                  Hán tự *
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: activeTheme.colors.cardBg,
                      color: activeTheme.colors.textPrimary,
                    },
                  ]}
                  value={editKanji}
                  onChangeText={setEditKanji}
                  placeholder="Ví dụ: 学习"
                  placeholderTextColor={activeTheme.colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: activeTheme.colors.textSecondary }]}>
                  Pinyin *
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: activeTheme.colors.cardBg,
                      color: activeTheme.colors.textPrimary,
                    },
                  ]}
                  value={editPinyin}
                  onChangeText={setEditPinyin}
                  placeholder="Ví dụ: xué xí"
                  placeholderTextColor={activeTheme.colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: activeTheme.colors.textSecondary }]}>
                  Nghĩa tiếng Việt *
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: activeTheme.colors.cardBg,
                      color: activeTheme.colors.textPrimary,
                    },
                  ]}
                  value={editMeaning}
                  onChangeText={setEditMeaning}
                  placeholder="Ví dụ: Học tập"
                  placeholderTextColor={activeTheme.colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: activeTheme.colors.textSecondary }]}>
                  Câu ví dụ
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: activeTheme.colors.cardBg,
                      color: activeTheme.colors.textPrimary,
                      minHeight: 80,
                    },
                  ]}
                  multiline
                  value={editExample}
                  onChangeText={setEditExample}
                  placeholder="Ví dụ câu..."
                  placeholderTextColor={activeTheme.colors.textLight}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <DuolingoButton
                  title="HỦY"
                  variant="secondary"
                  onPress={() => setShowEditModal(false)}
                />
                <DuolingoButton title="LƯU THAY ĐỔI" variant="primary" onPress={handleSaveEdit} />
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
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
  actionRow: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  editOutlineBtn: {
    width: "100%",
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  editOutlineText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.base,
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
  fullModalContainer: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  closeBtn: {
    padding: 4,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  fullModalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  inputText: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "flex-end",
    marginTop: theme.spacing.md,
  },
});
