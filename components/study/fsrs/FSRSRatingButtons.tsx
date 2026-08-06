import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CardEntity, ensureFSRSState } from '../../../src/domain/card/cardEntity';
import { FSRSEngine } from '../../../src/domain/fsrs/fsrsEngine';
import { FSRSScheduleResult, Rating } from '../../../src/domain/fsrs/fsrsTypes';
import { Colors } from '../../../constants/theme';

interface FSRSRatingButtonsProps {
  card: CardEntity;
  onRating: (rating: Rating) => void;
  disabled?: boolean;
}

const engine = new FSRSEngine();

export const FSRSRatingButtons: React.FC<FSRSRatingButtonsProps> = ({
  card,
  onRating,
  disabled = false,
}) => {
  const fsrsState = ensureFSRSState(card);
  const scheduled: FSRSScheduleResult = engine.repeatCard(fsrsState);

  const formatIntervalLabel = (rating: Rating): string => {
    const item = scheduled[rating];
    const schedDays = item.log.scheduled_days;

    if (schedDays === 0) {
      return '10m';
    }
    if (schedDays === 1) {
      return '1d';
    }
    if (schedDays < 30) {
      return `${schedDays}d`;
    }
    if (schedDays < 365) {
      const months = (schedDays / 30).toFixed(1);
      return `${months}m`;
    }
    const years = (schedDays / 365).toFixed(1);
    return `${years}y`;
  };

  const handlePress = (rating: Rating) => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional on web
    }
    onRating(rating);
  };

  return (
    <View style={styles.container}>
      {/* Again (Red 3D) */}
      <Pressable
        disabled={disabled}
        onPress={() => handlePress(Rating.Again)}
        style={({ pressed }) => [
          styles.button,
          styles.againBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.btnTitle}>Quên</Text>
        <Text style={styles.btnInterval}>{formatIntervalLabel(Rating.Again)}</Text>
      </Pressable>

      {/* Hard (Yellow 3D) */}
      <Pressable
        disabled={disabled}
        onPress={() => handlePress(Rating.Hard)}
        style={({ pressed }) => [
          styles.button,
          styles.hardBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.btnTitle}>Khó</Text>
        <Text style={styles.btnInterval}>{formatIntervalLabel(Rating.Hard)}</Text>
      </Pressable>

      {/* Good (Green 3D) */}
      <Pressable
        disabled={disabled}
        onPress={() => handlePress(Rating.Good)}
        style={({ pressed }) => [
          styles.button,
          styles.goodBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.btnTitle}>Tốt</Text>
        <Text style={styles.btnInterval}>{formatIntervalLabel(Rating.Good)}</Text>
      </Pressable>

      {/* Easy (Blue 3D) */}
      <Pressable
        disabled={disabled}
        onPress={() => handlePress(Rating.Easy)}
        style={({ pressed }) => [
          styles.button,
          styles.easyBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.btnTitle}>Dễ</Text>
        <Text style={styles.btnInterval}>{formatIntervalLabel(Rating.Easy)}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  },
  pressed: {
    transform: [{ translateY: 3 }],
    borderBottomWidth: 1,
  },
  againBtn: {
    backgroundColor: Colors.srs.again,
    borderBottomColor: Colors.duolingo.redDark,
  },
  hardBtn: {
    backgroundColor: Colors.duolingo.yellow,
    borderBottomColor: Colors.duolingo.yellowDark,
  },
  goodBtn: {
    backgroundColor: Colors.srs.good,
    borderBottomColor: Colors.duolingo.greenDark,
  },
  easyBtn: {
    backgroundColor: Colors.srs.easy,
    borderBottomColor: Colors.duolingo.blueDark,
  },
  btnTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  btnInterval: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
});
