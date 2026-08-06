import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FSRSEngine } from '../../../src/domain/fsrs/fsrsEngine';
import { State } from '../../../src/domain/fsrs/fsrsTypes';

interface RetrievabilityBadgeProps {
  stability: number;
  lastReview: string | null;
  state: State;
}

const engine = new FSRSEngine();

export const RetrievabilityBadge: React.FC<RetrievabilityBadgeProps> = ({
  stability,
  lastReview,
  state,
}) => {
  if (state === State.New || !lastReview || stability <= 0) {
    return (
      <View style={[styles.badge, styles.newBadge]}>
        <Text style={styles.text}>Mới (New)</Text>
      </View>
    );
  }

  const now = new Date();
  const lastDate = new Date(lastReview);
  const elapsedDays = Math.max(
    0,
    (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
  );

  const retrievability = engine.calculateRetrievability(elapsedDays, stability);
  const percentage = Math.round(retrievability * 100);

  let badgeStyle = styles.greenBadge;
  let textStyle = styles.greenText;

  if (percentage < 50) {
    badgeStyle = styles.redBadge;
    textStyle = styles.redText;
  } else if (percentage < 75) {
    badgeStyle = styles.yellowBadge;
    textStyle = styles.yellowText;
  }

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.text, textStyle]}>Khả năng nhớ: {percentage}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 6,
  },
  newBadge: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  greenBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  yellowBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  redBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  greenText: {
    color: '#059669',
  },
  yellowText: {
    color: '#D97706',
  },
  redText: {
    color: '#DC2626',
  },
});
