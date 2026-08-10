import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DailyReviewLog } from "../../../infrastructure/persistence/reviewTrackerRepo.js";
import { theme } from "../../theme/theme.js";
import { useTheme } from "../../theme/ThemeContext.js";
import { DuolingoCard } from "../DuolingoCard.js";

export interface ActivityChartProps {
  logs: DailyReviewLog[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ logs }) => {
  const { theme: currentTheme } = useTheme();
  const maxCount = Math.max(...logs.map((l) => l.count), 1);

  return (
    <DuolingoCard accessibilityLabel="Biểu đồ lượt học 7 ngày gần đây">
      <Text style={[styles.chartTitle, { color: currentTheme.colors.textPrimary }]}>
        HOẠT ĐỘNG 7 NGÀY GẦN ĐÂY
      </Text>
      <View style={styles.chartContainer}>
        {logs.map((log) => {
          const heightPercent = (log.count / maxCount) * 100;
          const dayLabel = log.date.slice(5);

          return (
            <View key={log.date} style={styles.chartBarCol}>
              <Text style={[styles.barCount, { color: currentTheme.colors.textSecondary }]}>
                {log.count > 0 ? log.count : ""}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${Math.max(8, heightPercent)}%`,
                      backgroundColor:
                        log.count > 0 ? currentTheme.colors.primary : currentTheme.colors.cardBorder,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barDay, { color: currentTheme.colors.textSecondary }]}>
                {dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </DuolingoCard>
  );
};

const styles = StyleSheet.create({
  chartTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  chartBarCol: {
    alignItems: "center",
    width: "12%",
    height: "100%",
    justifyContent: "flex-end",
  },
  barCount: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    width: "100%",
    height: "80%",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barDay: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});
