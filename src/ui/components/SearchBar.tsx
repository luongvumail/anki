import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../theme/ThemeContext.js";
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
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.cardBg }]}>
      <Icon name="search" size={20} color={theme.colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        style={[styles.input, { color: theme.colors.textPrimary }]}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange("")}
          accessibilityLabel="Xóa từ khóa tìm kiếm"
          style={styles.clearBtn}
        >
          <Icon name="close" size={16} color={theme.colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  clearBtn: {
    padding: 4,
  },
});
