import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { theme } from "../theme/theme.js";
import { Icon } from "./Icon.js";

export interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Tìm kiếm từ vựng...",
}) => {
  return (
    <View style={styles.container}>
      <Icon name="search" size={20} color={theme.colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange("")}
          accessibilityLabel="Xóa từ khóa tìm kiếm"
          style={styles.clearBtn}
        >
          <Icon name="trash" size={16} color={theme.colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  clearBtn: {
    padding: theme.spacing.xs,
  },
});
