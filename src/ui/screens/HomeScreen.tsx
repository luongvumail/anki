import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { computeForecastForgotten, getDailyDueSummary } from "../../domain/card/cardUtils.js";
import { AIAddCardModal } from "../components/AIAddCardModal.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { FloatingAddButton } from "../components/FloatingAddButton.js";
import { Icon } from "../components/Icon.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { ZigZagSkillPath } from "../components/ZigZagSkillPath.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { appStore } from "../store/useAppStore.js";

export interface HomeScreenProps {
  onStartStudy: (deckId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartStudy }) => {
  const { theme } = useTheme();
  const [storeState, setStoreState] = useState(appStore.getState());
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  useEffect(() => {
    appStore.loadDecks().then((loadedDecks) => {
      if (loadedDecks && loadedDecks.length > 0) {
        loadedDecks.forEach((deck) => {
          appStore.fetchCards(deck.id);
        });
      }
    });

    const unsubscribe = appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
    return unsubscribe;
  }, []);

  const { decks, cards } = storeState;

  const dueSummary = useMemo(() => {
    return getDailyDueSummary(cards);
  }, [cards]);

  const forecastForgottenCount = useMemo(() => {
    return computeForecastForgotten(cards, 1);
  }, [cards]);

  const handleStartUrgentStudy = () => {
    const targetDeckId = dueSummary.urgentDeckId || decks[0]?.id || "";
    if (targetDeckId) onStartStudy(targetDeckId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Smart Daily Review Queue Banner */}
        <DuolingoCard accessibilityLabel="Hàng chờ bài học hôm nay">
          <View style={styles.dailyQueueHeader}>
            <Icon name="clock" size={28} color={theme.colors.primary} />
            <View style={styles.dailyQueueTextCol}>
              <Text style={[styles.dailyQueueTitle, { color: theme.colors.textPrimary }]}>
                BÀI HỌC HÔM NAY (FSRS v5)
              </Text>
              <Text style={[styles.dailyQueueSubtitle, { color: theme.colors.textSecondary }]}>
                {dueSummary.totalDue > 0
                  ? `Có ${dueSummary.totalDue} từ vựng cần bạn ôn tập ngay!`
                  : "Tuyệt vời! Bạn đã hoàn thành tất cả từ vựng cần ôn hôm nay."}
              </Text>
            </View>
          </View>

          {dueSummary.totalDue > 0 && (
            <View style={styles.dailyQueueBtnWrapper}>
              <DuolingoButton
                title={`HỌC NGAY (${dueSummary.totalDue} THẺ)`}
                variant="primary"
                onPress={handleStartUrgentStudy}
                accessibilityLabel="Học các thẻ cần ôn hôm nay"
              />
            </View>
          )}
        </DuolingoCard>

        {/* Retention Forecast Card */}
        {forecastForgottenCount > 0 && (
          <View style={styles.forecastSection}>
            <DuolingoCard accessibilityLabel="Dự báo trí nhớ FSRS v5">
              <View style={styles.forecastHeader}>
                <Icon name="brain" size={24} color={theme.colors.secondary} />
                <View style={styles.forecastTextCol}>
                  <Text style={styles.forecastTitle}>DỰ BÁO TRÍ NHỚ (24H TỚI)</Text>
                  <Text style={[styles.forecastSubtitle, { color: theme.colors.textSecondary }]}>
                    Thuật toán FSRS v5 dự báo có khoảng{" "}
                    <Text style={styles.forecastHighlight}>{forecastForgottenCount} từ vựng</Text>{" "}
                    có nguy cơ rơi khỏi bộ nhớ nếu không ôn tập.
                  </Text>
                </View>
                <StatusBadge variant="warning" label={`~${forecastForgottenCount} TỪ`} size="sm" />
              </View>
            </DuolingoCard>
          </View>
        )}

        {/* ZigZag Skill Path */}
        {decks.length > 0 ? (
          <ZigZagSkillPath
            decks={decks}
            urgentDeckId={dueSummary.urgentDeckId}
            onSelectDeck={onStartStudy}
          />
        ) : (
          <DuolingoCard accessibilityLabel="Chưa có bộ thẻ nào">
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <Icon name="sparkles" size={36} color={theme.colors.primary} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: theme.colors.textPrimary,
                  marginTop: 8,
                  marginBottom: 4,
                  textAlign: "center",
                }}
              >
                CHƯA CÓ BỘ THẺ NÀO
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Bạn chưa tạo bộ thẻ nào. Hãy bấm nút tạo bên dưới để bắt đầu bài học của riêng bạn!
              </Text>
              <View style={{ width: "100%" }}>
                <DuolingoButton
                  title="+ TẠO BỘ THẺ MỚI"
                  variant="primary"
                  onPress={() => setIsAIModalOpen(true)}
                />
              </View>
            </View>
          </DuolingoCard>
        )}
      </ScrollView>

      {/* Floating Add Button for AI */}
      <FloatingAddButton onPress={() => setIsAIModalOpen(true)} />

      {/* AI Add Card Modal */}
      <AIAddCardModal visible={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.cardBg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  streakText: {
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.secondary,
  },
  xpText: {
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
  },
  dailyQueueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dailyQueueTextCol: {
    flex: 1,
  },
  dailyQueueTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  dailyQueueSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dailyQueueBtnWrapper: {
    marginTop: theme.spacing.xs,
  },
  forecastSection: {
    marginTop: theme.spacing.md,
  },
  forecastHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  forecastTextCol: {
    flex: 1,
  },
  forecastTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.secondary,
  },
  forecastSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  forecastHighlight: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.secondary,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: "center",
    marginVertical: theme.spacing.md,
  },
});
