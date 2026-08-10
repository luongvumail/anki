import React from "react";
import { StyleSheet, View } from "react-native";
import { Rating } from "../../domain/fsrs/fsrsTypes.js";
import { theme } from "../theme/theme.js";
import { DuolingoButton } from "./DuolingoButton.js";

export interface FSRSRatingButtonsProps {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

export const FSRSRatingButtons: React.FC<FSRSRatingButtonsProps> = ({
  onRate,
  disabled = false,
}) => {
  return (
    <View style={styles.grid}>
      <View style={styles.btnCol}>
        <DuolingoButton
          title="Quên (1d)"
          variant="danger"
          disabled={disabled}
          onPress={() => onRate(Rating.Again)}
          accessibilityLabel="Đánh giá Quên - Ôn lại sau 1 ngày"
        />
      </View>
      <View style={styles.btnCol}>
        <DuolingoButton
          title="Khó (2d)"
          variant="secondary"
          disabled={disabled}
          onPress={() => onRate(Rating.Hard)}
          accessibilityLabel="Đánh giá Khó - Ôn lại sau 2 ngày"
        />
      </View>
      <View style={styles.btnCol}>
        <DuolingoButton
          title="Tốt (5d)"
          variant="primary"
          disabled={disabled}
          onPress={() => onRate(Rating.Good)}
          accessibilityLabel="Đánh giá Tốt - Ôn lại sau 5 ngày"
        />
      </View>
      <View style={styles.btnCol}>
        <DuolingoButton
          title="Dễ (15d)"
          variant="info"
          disabled={disabled}
          onPress={() => onRate(Rating.Easy)}
          accessibilityLabel="Đánh giá Dễ - Ôn lại sau 15 ngày"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  btnCol: {
    flex: 1,
  },
});
