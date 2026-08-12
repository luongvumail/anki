import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Radii } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface InsetGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const InsetGroup = React.memo(function InsetGroup({ children, style }: InsetGroupProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.insetGroup, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }, style]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  insetGroup: {
    borderRadius: Radii.card,
    borderWidth: 2,
    overflow: 'hidden',
  },
});
