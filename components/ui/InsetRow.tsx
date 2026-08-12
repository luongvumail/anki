import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Typography, Spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface InsetRowProps {
  label: string;
  value?: string | number;
  valueColor?: string;
  isBorder?: boolean;
  right?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
}

export function InsetRow({
  label,
  value,
  valueColor,
  isBorder = false,
  right,
  style,
  labelStyle,
  valueStyle,
}: InsetRowProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.row,
        isBorder && { borderTopWidth: 1, borderTopColor: theme.divider },
        style,
      ]}
    >
      <Text style={[styles.label, { color: theme.textPrimary }, labelStyle]}>{label}</Text>
      {right ? (
        right
      ) : (
        <Text
          style={[
            styles.value,
            { color: valueColor || theme.textMuted },
            valueStyle,
          ]}
        >
          {value ?? ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.cellHorizontal,
    paddingVertical: Spacing.cellVertical,
    minHeight: Spacing.cellMinHeight,
  },
  label: {
    width: 140,
    fontSize: Typography.bodyMD.fontSize,
    fontWeight: Typography.weight.medium,
  },
  value: {
    flex: 1,
    fontSize: Typography.bodyMD.fontSize,
  },
});
