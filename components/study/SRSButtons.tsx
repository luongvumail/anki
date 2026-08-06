import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FSRSRatingButtons } from './fsrs/FSRSRatingButtons';
import { Rating } from '../../src/domain/fsrs/fsrsTypes';
import { CardEntity } from '../../src/domain/card/cardEntity';

interface SRSButtonsProps {
  cardSRS?: any;
  card?: CardEntity;
  onGrade: (grade: number, direction?: 'left' | 'right' | 'up' | 'down') => void;
}

export const SRSButtons = React.memo(function SRSButtons({ card, onGrade }: SRSButtonsProps) {
  const dummyCard: CardEntity = card || {
    id: 'temp',
    deckId: 'temp',
    character: '字',
    pinyin: 'zì',
    translation: 'character',
    examples: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <View style={styles.srsArea}>
      <FSRSRatingButtons
        card={dummyCard}
        onRating={(rating: Rating) => {
          onGrade(rating);
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  srsArea: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
});
