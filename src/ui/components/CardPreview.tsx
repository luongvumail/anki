import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CardData } from "../../infrastructure/ai/geminiService.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";

export interface CardPreviewProps {
  cardData: CardData;
  onRemove: () => void;
  onUpdate?: (updated: CardData) => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ cardData, onRemove, onUpdate }) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [pinyin, setPinyin] = useState(cardData.pinyin);
  const [meaning, setMeaning] = useState(cardData.meaning);
  const [example, setExample] = useState(cardData.exampleSentence || "");

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...cardData,
        pinyin: pinyin.trim(),
        meaning: meaning.trim(),
        exampleSentence: example.trim(),
      });
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <DuolingoCard accessibilityLabel={`Sửa thẻ xem trước ${cardData.kanji}`}>
        <View style={styles.editForm}>
          <Text style={[styles.kanji, { color: theme.colors.textPrimary }]}>{cardData.kanji}</Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.cardBg, color: theme.colors.textPrimary },
            ]}
            value={pinyin}
            onChangeText={setPinyin}
            placeholder="Pinyin"
            placeholderTextColor={theme.colors.textLight}
          />
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.cardBg, color: theme.colors.textPrimary },
            ]}
            value={meaning}
            onChangeText={setMeaning}
            placeholder="Nghĩa tiếng Việt"
            placeholderTextColor={theme.colors.textLight}
          />
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.cardBg, color: theme.colors.textPrimary },
            ]}
            value={example}
            onChangeText={setExample}
            placeholder="Ví dụ câu"
            placeholderTextColor={theme.colors.textLight}
          />

          <View style={styles.editBtnRow}>
            <Pressable onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
              <Text style={[styles.btnTextSecondary, { color: theme.colors.textSecondary }]}>
                HỦY
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={styles.btnTextPrimary}>LƯU</Text>
            </Pressable>
          </View>
        </View>
      </DuolingoCard>
    );
  }

  return (
    <DuolingoCard accessibilityLabel={`Xem trước thẻ ${cardData.kanji}`}>
      <View style={styles.header}>
        <View style={styles.content}>
          <Text style={[styles.kanji, { color: theme.colors.textPrimary }]}>{cardData.kanji}</Text>
          <Text style={[styles.pinyin, { color: theme.colors.primary }]}>{cardData.pinyin}</Text>
          <Text style={[styles.meaning, { color: theme.colors.textSecondary }]}>
            {cardData.meaning}
          </Text>
          {cardData.exampleSentence && (
            <Text style={[styles.example, { color: theme.colors.textLight }]}>
              "{cardData.exampleSentence}"
            </Text>
          )}
        </View>

        <View style={styles.actionBtns}>
          {onUpdate && (
            <Pressable
              onPress={() => setIsEditing(true)}
              accessibilityLabel="Chỉnh sửa thẻ xem trước"
              style={styles.actionBtn}
            >
              <Icon name="wrench" size={18} color={theme.colors.primary} />
            </Pressable>
          )}
          <Pressable
            onPress={onRemove}
            accessibilityLabel="Xóa thẻ khỏi danh sách tạo"
            style={styles.actionBtn}
          >
            <Icon name="trash" size={18} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </DuolingoCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
  },
  kanji: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  pinyin: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  meaning: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  example: {
    fontSize: theme.fontSize.xs,
    fontStyle: "italic",
    color: theme.colors.textLight,
  },
  actionBtns: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    alignItems: "center",
  },
  actionBtn: {
    padding: theme.spacing.xs,
  },
  editForm: {
    gap: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  editBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  cancelBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  saveBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
  },
  btnTextSecondary: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  btnTextPrimary: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
});
