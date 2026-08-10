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
import { appStore } from "../store/useAppStore.js";

export interface HomeScreenProps {
  onStartStudy: (deckId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartStudy }) => {
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

  const { decks, userProgress, cards } = storeState;

  const dueSummary = useMemo(() => {
    return getDailyDueSummary(cards);
  }, [cards]);

  const forecastForgottenCount = useMemo(() => {
    return computeForecastForgotten(cards, 1);
  }, [cards]);

  const handleStartUrgentStudy = () => {
    const targetDeckId = dueSummary.urgentDeckId || decks[0]?.id || "deck_hsk1";
    onStartStudy(targetDeckId);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header: Streak & XP */}
        <View style={styles.header}>
          <View style={styles.statBox}>
            <Icon name="flame" color={theme.colors.secondary} />
            <Text style={styles.streakText}>
              {userProgress.streakDays} Ngày Streak
            </Text>
          </View>
          <View style={styles.statBox}>
            <Icon name="zap" color={theme.colors.primary} />
            <Text style={styles.xpText}>
              {userProgress.totalXp} XP (Lv. {userProgress.level})
            </Text>
          </View>
        </View>

        {/* Smart Daily Review Queue Banner */}
        <DuolingoCard accessibilityLabel="Hàng chờ bài học hôm nay">
          <View style={styles.dailyQueueHeader}>
            <Icon name="clock" size={28} color={theme.colors.primary} />
            <View style={styles.dailyQueueTextCol}>
              <Text style={styles.dailyQueueTitle}>BÀI HỌC HÔM NAY (FSRS v5)</Text>
              <Text style={styles.dailyQueueSubtitle}>
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
                  <Text style={styles.forecastSubtitle}>
                    Thuật toán FSRS v5 dự báo có khoảng <Text style={styles.forecastHighlight}>{forecastForgottenCount} từ vựng</Text> có nguy cơ rơi khỏi bộ nhớ nếu không ôn tập.
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
            <Text style={styles.emptyText}>
              Chưa có bộ thẻ nào. Hãy bấm nút "+" bên dưới để sinh thẻ AI!
            </Text>
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
