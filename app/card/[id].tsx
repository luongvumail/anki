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
import { useStore } from "../../store/useStore";
import { isDue, FSRSState } from "../../lib/srs";
import { getPinyinToneColor } from "../../lib/pinyinColor";
import {
  Spacing,
  Radii,
  Typography,
  Layout,
  BorderWidths,
  triggerHaptic,
} from "../../constants/theme";
import { APP_CONFIG } from "../../constants/config";
import { useTheme } from "../../hooks/useTheme";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { AppCard } from "../../components/ui/AppCard";
import { AppButton } from "../../components/ui/AppButton";
import { AudioButton } from "../../components/ui/AudioButton";
import { LoadingIndicator } from "../../components/ui/LoadingIndicator";
import { generateRadical } from "../../lib/gemini";

export default function CardDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, deckId } = useLocalSearchParams<{ id: string; deckId: string }>();
  const { theme } = useTheme();
  const cards = useStore((s) => s.cards);
  const fetchCards = useStore((s) => s.fetchCards);
  const deleteCard = useStore((s) => s.deleteCard);
  const updateCard = useStore((s) => s.updateCard);
  const [speaking, setSpeaking] = useState(false);
  const [generatingRadical, setGeneratingRadical] = useState(false);

  useEffect(() => {
    if (deckId && !cards[deckId]) {
      fetchCards(deckId);
    }
  }, [deckId, cards, fetchCards]);

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
      rate: APP_CONFIG.SPEECH_RATE,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const handleGenerateRadical = async () => {
    if (!card || generatingRadical) return;
    try {
      setGeneratingRadical(true);
      triggerHaptic("light");
      const radical = await generateRadical(card.character);
      if (radical && radical.trim().length > 0) {
        await updateCard(card.id, deckId, { radical });
        triggerHaptic("success");
      } else {
        Alert.alert("Thông báo", "AI không thể phân tích bộ thủ cho từ này. Vui lòng thử lại.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[card/generateRadical] Failed to generate radical:", msg);
      if (msg.includes("User location") || msg.includes("chưa hỗ trợ trực tiếp")) {
        Alert.alert(
          "Giới hạn vùng AI (Region Unsupported)",
          "Google Gemini AI chưa hỗ trợ trực tiếp vị trí mạng của bạn. Vui lòng bật VPN hoặc sử dụng các từ vựng phổ biến có sẵn từ điển chiết tự offline.",
        );
      } else {
        Alert.alert("Lỗi", "Không thể kết nối AI. Vui lòng kiểm tra kết nối mạng và thử lại.");
      }
    } finally {
      setGeneratingRadical(false);
    }
  };

  if (!card) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View
          style={[
            styles.headerBar,
            {
              paddingTop: Math.max(insets.top + Spacing.sm, Spacing.cellMinHeight),
              backgroundColor: theme.bg,
              borderBottomColor: theme.cardBorder,
            },
          ]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={Layout.iconLg} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
        <LoadingIndicator message="Đang nạp thông tin thẻ..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Clean Sub-screen Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top + Spacing.sm, Spacing.cellMinHeight),
            backgroundColor: theme.bg,
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={Layout.iconLg} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>CHI TIẾT TỪ VỰNG</Text>

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
        <AppCard style={styles.heroCard}>
          <Text style={[styles.characterBig, { color: theme.textPrimary }]}>{card.character}</Text>
          {card.traditional && card.traditional !== card.character ? (
            <Text style={[styles.traditionalText, { color: theme.textMuted }]}>
              Phồn thể: {card.traditional}
            </Text>
          ) : null}

          <View style={styles.pinyinAudioRow}>
            <Text style={[styles.pinyinBig, { color: getPinyinToneColor(card.pinyin) }]}>
              {card.pinyin}
            </Text>
            <AudioButton onPress={speak} isPlaying={speaking} size="md" />
          </View>

          <Text style={[styles.translationBig, { color: theme.textPrimary }]}>
            {card.translation}
          </Text>
        </AppCard>

        {/* AI Radical Breakdown */}
        <SectionTitle>PHÂN TÍCH BỘ THỦ & CẤU TRÚC (AI)</SectionTitle>
        <AppCard style={styles.radicalCard}>
          <View style={styles.radicalHeader}>
            <View style={styles.radicalHeaderLeft}>
              <Ionicons name="sparkles" size={Layout.iconMd} color={theme.blue} />
              <Text style={[styles.radicalHeaderTitle, { color: theme.blue }]}>
                Bộ thủ & Chiết tự Hán tự
              </Text>
            </View>

            {!card.radical && (
              <AppButton
                title={generatingRadical ? "ĐANG TẠO..." : "TẠO BẰNG AI"}
                variant="blue"
                size="sm"
                disabled={generatingRadical}
                onPress={handleGenerateRadical}
                icon={
                  generatingRadical ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="sparkles" size={Layout.iconSm} color="#FFFFFF" />
                  )
                }
              />
            )}
          </View>

          {card.radical ? (
            <View style={styles.radicalRow}>
              <Text style={[styles.radicalContent, { color: theme.textPrimary }]}>
                {card.radical}
              </Text>
              <TouchableOpacity onPress={handleGenerateRadical} disabled={generatingRadical}>
                <Ionicons name="refresh-circle" size={Layout.iconLg} color={theme.purple} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.radicalEmpty, { color: theme.textMuted }]}>
              Từ vựng này chưa có phân tích bộ thủ. Bấm "TẠO BẰNG AI" để phân tích ngay!
            </Text>
          )}
        </AppCard>

        {/* FSRS Parameters & Level Detail Card */}
        <SectionTitle>THÔNG SỐ LẶP LẠI TỰ ĐỘNG (FSRS)</SectionTitle>
        <AppCard style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Trạng thái FSRS</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    !card.srs || card.srs.state === FSRSState.New
                      ? theme.blue
                      : isDue(card.srs)
                        ? theme.yellow
                        : theme.green,
                },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {!card.srs || card.srs.state === FSRSState.New
                  ? "MỚI CHƯA HỌC"
                  : isDue(card.srs)
                    ? "CẦN ÔN TẬP"
                    : "ĐÃ GHI NHỚ"}
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.borderTop, { borderTopColor: theme.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Số lần ôn lại</Text>
            <Text style={[styles.detailVal, { color: theme.textPrimary }]}>
              {card.srs?.repetitions || 0} lần
            </Text>
          </View>

          <View style={[styles.detailRow, styles.borderTop, { borderTopColor: theme.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
              Khoảng cách nhắc lại
            </Text>
            <Text style={[styles.detailVal, { color: theme.textPrimary }]}>
              {card.srs?.interval || 0} ngày
            </Text>
          </View>

          <View style={[styles.detailRow, styles.borderTop, { borderTopColor: theme.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
              Hệ số dễ (Ease Factor)
            </Text>
            <Text style={[styles.detailVal, { color: theme.textPrimary }]}>
              {card.srs?.easeFactor ? card.srs.easeFactor.toFixed(2) : "2.50"}
            </Text>
          </View>

          {card.hskLevel ? (
            <View
              style={[styles.detailRow, styles.borderTop, { borderTopColor: theme.cardBorder }]}
            >
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Trình độ HSK</Text>
              <Text style={[styles.detailVal, { color: theme.blue }]}>HSK {card.hskLevel}</Text>
            </View>
          ) : null}

          {card.strokeCount ? (
            <View
              style={[styles.detailRow, styles.borderTop, { borderTopColor: theme.cardBorder }]}
            >
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Số nét vẽ Hán tự</Text>
              <Text style={[styles.detailVal, { color: theme.textPrimary }]}>
                {card.strokeCount} nét
              </Text>
            </View>
          ) : null}
        </AppCard>

        {/* Examples Section */}
        {card.examples && card.examples.length > 0 && (
          <>
            <SectionTitle>CÂU VÍ DỤ MẪU</SectionTitle>
            {card.examples.map((ex, i) => (
              <AppCard key={i} style={styles.exampleCard}>
                <Text style={[styles.exampleCn, { color: theme.textPrimary }]}>{ex.chinese}</Text>
                <Text style={[styles.examplePy, { color: theme.blue }]}>{ex.pinyin}</Text>
                <Text style={[styles.exampleVi, { color: theme.textMuted }]}>{ex.vietnamese}</Text>
              </AppCard>
            ))}
          </>
        )}

        {/* Danger Zone Action Button */}
        <AppButton
          title="XÓA THẺ TỪ VỰNG NÀY"
          variant="error"
          size="lg"
          onPress={handleDelete}
          style={{ marginTop: Spacing.lg }}
          icon={<Ionicons name="trash-outline" size={Layout.iconMd} color="#FFFFFF" />}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.xs,
    borderBottomWidth: BorderWidths.thin,
  },
  backBtn: { padding: Spacing.xs, width: Layout.avatarSm },
  headerTitle: {
    flex: 1,
    fontSize: Typography.callout.fontSize,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerPlaceholder: { width: Layout.avatarSm },

  scrollContent: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.md },

  heroCard: { padding: Spacing.xl, alignItems: "center", marginBottom: Spacing.lg },
  characterBig: {
    fontSize: Typography.hanziHero.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  traditionalText: { fontSize: Typography.caption.fontSize, marginTop: 2 },
  pinyinAudioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.cellPadding,
    marginTop: Spacing.xs,
  },
  pinyinBig: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold },
  translationBig: {
    fontSize: Typography.titleMD.fontSize,
    fontWeight: Typography.weight.extraBold,
    marginTop: Spacing.sm,
    textAlign: "center",
  },

  detailCard: { padding: Spacing.md, marginBottom: Spacing.md },

  radicalCard: { padding: Spacing.md, marginBottom: Spacing.md },
  radicalRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.cellPadding },
  radicalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  radicalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  radicalHeaderTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  radicalContent: {
    flex: 1,
    fontSize: Typography.caption1.fontSize,
    fontWeight: Typography.weight.semibold,
    lineHeight: 22,
  },
  radicalEmpty: {
    fontSize: Typography.caption.fontSize,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  borderTop: { borderTopWidth: BorderWidths.thin },
  detailLabel: { fontSize: Typography.caption1.fontSize, fontWeight: Typography.weight.semibold },
  detailVal: { fontSize: Typography.caption1.fontSize, fontWeight: Typography.weight.extraBold },

  statusBadge: {
    paddingHorizontal: Spacing.cellPadding,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  statusBadgeText: {
    fontSize: Typography.caption2.fontSize,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
  },

  exampleCard: { padding: Spacing.md, marginBottom: Spacing.md },
  exampleCn: { fontSize: Typography.bodyMD.fontSize, fontWeight: Typography.weight.extraBold },
  examplePy: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
  },
  exampleVi: { fontSize: Typography.caption.fontSize, marginTop: 2 },
});
