import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SRS_GRADES, getIntervalLabel, SRSState } from "../../lib/srs";
import { Typography, Spacing, Radii, Layout } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { AnimatedButton } from "../ui/AnimatedButton";

interface FSRSButtonsProps {
  cardFSRS: SRSState;
  onGrade: (grade: number, direction: "left" | "right" | "up" | "down") => void;
}

export const FSRSButtons = React.memo(function FSRSButtons({
  cardFSRS,
  onGrade,
}: FSRSButtonsProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[styles.srsArea, { paddingBottom: Math.max(insets.top, Spacing.xl) }]}>
      <Text style={[styles.srsLabel, { color: theme.textMuted }]}>ĐÁNH GIÁ MỨC ĐỘ GHI NHỚ</Text>
      <View style={styles.srsRow}>
        <FSRSButtonPropsItem
          label="QUÊN"
          sub={getIntervalLabel(SRS_GRADES.AGAIN, cardFSRS)}
          color={theme.red}
          subColor={theme.textMuted}
          onPress={() => onGrade(SRS_GRADES.AGAIN, "left")}
        />
        <FSRSButtonPropsItem
          label="KHÓ"
          sub={getIntervalLabel(SRS_GRADES.HARD, cardFSRS)}
          color={theme.yellow}
          subColor={theme.textMuted}
          onPress={() => onGrade(SRS_GRADES.HARD, "up")}
        />
        <FSRSButtonPropsItem
          label="THUỘC"
          sub={getIntervalLabel(SRS_GRADES.EASY, cardFSRS)}
          color={theme.green}
          subColor={theme.textMuted}
          onPress={() => onGrade(SRS_GRADES.EASY, "right")}
        />
      </View>
    </View>
  );
});

const FSRSButtonPropsItem = React.memo(function FSRSButtonPropsItem({
  label,
  sub,
  color,
  subColor,
  onPress,
}: {
  label: string;
  sub: string;
  color: string;
  subColor: string;
  onPress: () => void;
}) {
  return (
    <AnimatedButton
      style={[styles.srsBtn, { backgroundColor: color + "15" }]}
      onPress={onPress}
      activeScale={0.93}
    >
      <Text style={[styles.srsBtnLabel, { color }]}>{label}</Text>
      <Text style={[styles.srsBtnSub, { color: subColor }]}>{sub}</Text>
    </AnimatedButton>
  );
});

const styles = StyleSheet.create({
  srsArea: { paddingHorizontal: Spacing.pageMargin, paddingTop: Spacing.xs },
  srsLabel: {
    fontSize: Typography.caption.fontSize,
    textAlign: "center",
    marginBottom: Spacing.xs,
    letterSpacing: 1,
    fontWeight: Typography.weight.semibold,
  },
  srsRow: { flexDirection: "row", gap: Spacing.xs },
  srsBtn: {
    flex: 1,
    borderRadius: Radii.card,
    height: Layout.btnHeightXl,
    alignItems: "center",
    justifyContent: "center",
  },
  srsBtnLabel: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  srsBtnSub: {
    fontSize: Typography.caption2.fontSize,
    marginTop: 2,
    fontWeight: Typography.weight.semibold,
  },
});
