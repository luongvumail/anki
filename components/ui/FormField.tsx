import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Typography, Spacing, Radii, BorderWidths } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const FormField = React.memo(function FormField({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...props
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { theme } = useTheme();

  return (
    <Pressable style={[styles.fieldBox, containerStyle]} onPress={() => inputRef.current?.focus()}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }, labelStyle]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.bgSoft,
          },
        ]}
      >

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.textPrimary }, inputStyle]}
          placeholderTextColor={theme.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: theme.red }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>{helperText}</Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  fieldBox: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    borderRadius: Radii.card,
    minHeight: Spacing.minTouchTarget,
    justifyContent: 'center',
    borderWidth: BorderWidths.default,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.subhead.fontSize,
  },
  errorText: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs / 2,
  },
  helperText: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs / 2,
  },
});
