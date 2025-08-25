// src/components/game/DrawDeck.tsx
import React, { useState } from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { suits } from '../../data/deck';
import { useDeck } from '@/api/deckLocal';
import FlippableCard from './FlippableCard';

export default function DrawDeck({ characterId }: { characterId: string }) {
  const { data: deckRows } = useDeck(characterId);
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCard, setDrawnCard] = useState<{ value: string; suit: { symbol: string; color: string } } | null>(null);

  // 🔹 animations définies une seule fois
  const translateX = useSharedValue(0);
  const cardY = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  const shuffleAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const drawnCardAnim = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardY.value },
      { scale: cardScale.value },
    ],
    opacity: cardOpacity.value,
  }));

  const deckCards = React.useMemo(() => {
    if (!deckRows) return [] as { value: string; suit: { symbol: string; color: string } }[];
    const cards: { value: string; suit: { symbol: string; color: string } }[] = [];
    (deckRows as any[]).forEach((row) => {
      const suit = suits.find((s) => s.name === row.figure);
      if (suit && row.cards) {
        row.cards.split(';').forEach((val: string) => {
          cards.push({ value: val, suit });
        });
      }
    });
    return cards;
  }, [deckRows]);

  const drawRandomCard = () => {
    if (deckCards.length === 0) return null;
    return deckCards[Math.floor(Math.random() * deckCards.length)];
  };

  const handlePress = () => {
    if (!isShuffling && !drawnCard) {
      if (deckCards.length === 0) return;
      // Premier clic : démarrer le mélange
      setIsShuffling(true);
      translateX.value = withRepeat(withTiming(25, { duration: 200 }), -1, true);
    } else if (isShuffling) {
      // Deuxième clic : tirer une carte
      setIsShuffling(false);
      cancelAnimation(translateX);
      translateX.value = 0;

      const card = drawRandomCard();
      if (!card) return;
      setDrawnCard(card);

      // Animation d’apparition
      cardY.value = 50;
      cardScale.value = 0.8;
      cardOpacity.value = 0;
      cardY.value = withTiming(-220, { duration: 800 });
      cardScale.value = withTiming(1, { duration: 800 });
      cardOpacity.value = withTiming(1, { duration: 800 });
    } else if (drawnCard) {
      // Troisième clic : reset du tirage
      setDrawnCard(null);
      cardY.value = 0;
      cardScale.value = 0.8;
      cardOpacity.value = 0;
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Deck visible */}
      <Animated.View style={[styles.deck, shuffleAnim]}>
        <View style={styles.cardBack}>
          <Text style={styles.backText}>Étrange France</Text>
        </View>
      </Animated.View>

      {/* Carte tirée */}
      {drawnCard && (
        <Animated.View style={[styles.drawnCard, drawnCardAnim]}>
          <FlippableCard value={drawnCard.value} suit={drawnCard.suit} />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deck: {
    width: 140,
    height: 200,
    borderRadius: 15,
    backgroundColor: '#1f2937',
    borderWidth: 3,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawnCard: {
    position: 'absolute',
    top: 0,
  },
});
