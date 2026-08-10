import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnsweredItem } from "../hooks/useStudySession.js";
import { theme } from "../theme/theme.js";
import { DuolingoButton } from "./DuolingoButton.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";
import { StatusBadge } from "./StatusBadge.js";

export interface SessionDoneScreenProps {
  totalXpEarned: number;
  correctCount: number;
  incorrectCount: number;
  answeredLog?: AnsweredItem[];
  onFinish: () => void;
}

export const SessionDoneScreen: React.FC<SessionDoneScreenProps> = ({
  totalXpEarned,
  correctCount,
  incorrectCount,
  answeredLog = [],
  onFinish,
}) => {
  const [activeTab, setActiveTab] = useState<"ALL" | "CORRECT" | "INCORRECT">("ALL");

  const filteredItems = answeredLog.filter((item) => {
    if (activeTab === "CORRECT") return item.isCorrect;
    if (activeTab === "INCORRECT") return !item.isCorrect;
    return true;
  });

  return (
    <View style={styles.container}>
      <Icon name="celebrate" size={80} color={theme.colors.primary} />
      <Text style={styles.title}>HOÀN THÀNH PHIÊN HỌC!</Text>
      <Text style={styles.subtitle}>Bạn đã học rất xuất sắc!</Text>

      <DuolingoCard accessibilityLabel="Kết quả phiên học">
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.secondary }]}>
              +{totalXpEarned}
            </Text>
            <View style={styles.labelRow}>
              <Icon name="zap" size={14} color={theme.colors.secondary} />
              <Text style={styles.statLabel}>XP TÍCH LŨY</Text>
            </View>
          </View>

          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.primary }]}>
              {correctCount}
            </Text>
            <View style={styles.labelRow}>
              <Icon name="check" size={14} color={theme.colors.primary} />
              <Text style={styles.statLabel}>ĐÚNG</Text>
            </View>
          </View>

          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.colors.danger }]}>
              {incorrectCount}
            </Text>
            <View style={styles.labelRow}>
              <Icon name="wrench" size={14} color={theme.colors.danger} />
              <Text style={styles.statLabel}>SAI</Text>
            </View>
          </View>
        </View>
      </DuolingoCard>

      {/* Answer Breakdown Log */}
      {answeredLog.length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>CHI TIẾT TỪ VỰNG ĐÃ HỌC</Text>
          
          {/* Tab buttons */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setActiveTab("ALL")}
              style={[styles.tabBtn, activeTab === "ALL" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === "ALL" && styles.tabTextActive]}>
                Tất cả ({answeredLog.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("CORRECT")}
              style={[styles.tabBtn, activeTab === "CORRECT" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === "CORRECT" && styles.tabTextActive]}>
                Đúng ({correctCount})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("INCORRECT")}
              style={[styles.tabBtn, activeTab === "INCORRECT" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, activeTab === "INCORRECT" && styles.tabTextActive]}>
                Sai ({incorrectCount})
              </Text>
            </Pressable>
          </View>

          {/* List items */}
          <View style={styles.itemList}>
            {filteredItems.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemKanji}>{item.kanji}</Text>
                  <Text style={styles.itemPinyin}>{item.pinyin}</Text>
                  <Text style={styles.itemMeaning}>{item.meaning}</Text>
                </View>
                <StatusBadge
                  variant={item.isCorrect ? "learned" : "due"}
                  label={item.isCorrect ? "ĐÚNG" : "SAI"}
                  size="sm"
                />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.btnWrapper}>
        <DuolingoButton
          title="VỀ TRANG CHỦ"
          variant="primary"
          onPress={onFinish}
          accessibilityLabel="Về lại trang chủ"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.lg,
    width: "100%",
  },
  statCol: {
    alignItems: "center",
  },
  statNum: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  breakdownSection: {
    width: "100%",
    marginTop: theme.spacing.lg,
  },
  breakdownTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  tabRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  tabBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  itemList: {
    gap: theme.spacing.xs,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.cardBg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  itemLeft: {
    flex: 1,
  },
  itemKanji: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  itemPinyin: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  itemMeaning: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  btnWrapper: {
    marginTop: theme.spacing.xl,
    width: "100%",
  },
});
