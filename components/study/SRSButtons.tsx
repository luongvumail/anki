import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SRS_GRADES, getIntervalLabel, SRSState } from '../../lib/srs';
import { Typography, Spacing, Radii, Layout } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { AnimatedButton } from '../ui/AnimatedButton';

interface SRSButtonsProps {
  cardSRS: SRSState;
  onGrade: (grade: number, direction: 'left' | 'right' | 'up' | 'down') => void;
}

export const SRSButtons = React.memo(function SRSButtons({ cardSRS, onGrade }: SRSButtonsProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[styles.srsArea, { paddingBottom: Math.max(insets.top, Spacing.xl) }]}>
      <Text style={[styles.srsLabel, { color: theme.textMuted }]}>ĐÁNH GIÁ MỨC ĐỘ GHI NHỚ</Text>
      <View style={styles.srsRow}>
        <SRSButtonPropsItem
          label="QUÊN"
          sub={getIntervalLabel(SRS_GRADES.AGAIN, cardSRS)}
          color={theme.red}
          subColor={theme.textMuted}
          onPress={() => onGrade(SRS_GRADES.AGAIN, 'left')}
        />
        <SRSButtonPropsItem
          label="KHÓ"
          sub={getIntervalLabel(SRS_GRADES.HARD, cardSRS)}
          color={theme.purple}
          subColor={theme.textMuted}
          onPress={() => onGrade(SRS_GRADES.HARD, 'up')}
        />
        <SRSButtonPropsItem
          label="THUỘC"
          sub={getIntervalLabel(SRS_GRADES.EASY, cardSRS)}
          color={theme.green}
          subColor={theme.textMuted}
          onPress={() => onGrade(SRS_GRADES.EASY, 'right')}
        />
      </View>
    </View>
  );
});

const SRSButtonPropsItem = React.memo(function SRSButtonPropsItem({
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
      style={[styles.srsBtn, { backgroundColor: color + '15' }]}
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
  srsLabel: { fontSize: Typography.caption.fontSize, textAlign: 'center', marginBottom: Spacing.xs, letterSpacing: 1, fontWeight: Typography.weight.semibold },
  srsRow: { flexDirection: 'row', gap: Spacing.xs },
  srsBtn: {
    flex: 1,
    borderRadius: Radii.card,
    height: Layout.btnHeightXl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  srsBtnLabel: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  srsBtnSub: { fontSize: Typography.caption2.fontSize, marginTop: 2, fontWeight: Typography.weight.semibold },
});
