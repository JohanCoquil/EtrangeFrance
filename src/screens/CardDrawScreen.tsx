import React, { useState } from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { suits, values } from '../data/deck';
import FlippableCard from '../components/game/FlippableCard';

const NUM_BACK_CARDS = 5;

export default function CardDrawScreen() {
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCard, setDrawnCard] = useState<{ value: string; suit: { symbol: string; color: string } } | null>(null);

  const translateX = useSharedValue(0);

  const animStyles = Array.from({ length: NUM_BACK_CARDS }, (_, i) =>
    useAnimatedStyle(() => ({
      transform: [
        {
          translateX: translateX.value * ((i % 2 === 0 ? 1 : -1) * (i + 1) * 0.2),
        },
        {
          rotate: `${translateX.value * (i % 2 === 0 ? 0.2 : -0.2)}deg`,
        },
      ],
    }))
  );

  const handlePress = () => {
    if (!isShuffling && !drawnCard) {
      setIsShuffling(true);
      translateX.value = withRepeat(withTiming(10, { duration: 150 }), -1, true);
    } else if (isShuffling) {
      setIsShuffling(false);
      cancelAnimation(translateX);
      translateX.value = 0;

      // tirer une carte
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const value = values[Math.floor(Math.random() * values.length)];
      setDrawnCard({ value, suit });
    } else if (drawnCard) {
      setDrawnCard(null);
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Pile de cartes pour le shuffle */}
      {Array.from({ length: NUM_BACK_CARDS }).map((_, i) => (
        <Animated.View key={i} style={[styles.deck, animStyles[i]]}>
          <View style={styles.cardBack}>
            <Text style={styles.backText}>Étrange France</Text>
          </View>
        </Animated.View>
      ))}

      {/* Carte tirée */}
      {drawnCard && (
        <View style={styles.drawnCard}>
          <FlippableCard value={drawnCard.value} suit={drawnCard.suit} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deck: {
    width: 140,
    height: 200,
    borderRadius: 15,
    backgroundColor: '#1f2937',
    borderWidth: 3,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
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
  backText: { color: '#888', fontSize: 14, fontWeight: 'bold' },
  drawnCard: { marginTop: -240 },
});
