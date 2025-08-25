// src/components/game/PotCard.tsx
import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import Card from './Carte';

export type Suit = { symbol: string; color: string };
export type PotCardType = {
  value: string;
  suit: Suit;
  faceUp: boolean;
  inDeck: boolean;
};

type Props = {
  card: PotCardType;
  onAddToDeck: () => void;
};

export default function PotCard({ card, onAddToDeck }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -50) {
          onAddToDeck();
        }
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  if (card.faceUp) {
    return (
      <View style={[styles.cardContainer, { transform: [{ scale: 0.5 }] }]}> 
        <Card value={card.value} suit={card.suit} />
      </View>
    );
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[pan.getLayout(), styles.cardContainer, { transform: [{ scale: 0.5 }] }]}
    >
      <View style={styles.cardBack}>
        <Text style={styles.backText}>Étrange France</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 4,
  },
  cardBack: {
    width: 140,
    height: 200,
    borderRadius: 15,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#666',
  },
  backText: {
    color: '#bbb',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

