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
import Card from '../components/game/Carte';

// Nombre de dos de cartes affichés pendant le mélange
const NUM_BACK_CARDS = 10;

// Génère des facteurs aléatoires pour les animations de chaque carte
const generateRandomFactors = () =>
  Array.from({ length: NUM_BACK_CARDS }, () => ({
    dirX: Math.random() > 0.5 ? 1 : -1,
    dirY: Math.random() > 0.5 ? 1 : -1,
    ampX: Math.random() * 1.5 + 0.5, // amplitude horizontale
    ampY: Math.random() * 0.5, // légère variation verticale
    rot: (Math.random() - 0.5) * 1, // rotation aléatoire
  }));

export default function CardDrawScreen() {
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCard, setDrawnCard] = useState<{ value: string; suit: { symbol: string; color: string } } | null>(null);
  const [randomFactors, setRandomFactors] = useState(generateRandomFactors);

  const translateX = useSharedValue(0);

  const animStyles = randomFactors.map(({ dirX, dirY, ampX, ampY, rot }) =>
    useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value * dirX * ampX },
        { translateY: translateX.value * dirY * ampY },
        { rotate: `${translateX.value * rot}deg` },
      ],
    }))
  );

  const handlePress = () => {
    if (!isShuffling && !drawnCard) {
      setRandomFactors(generateRandomFactors());
      setIsShuffling(true);
      translateX.value = withRepeat(withTiming(15, { duration: 150 }), -1, true);
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
          <Card value={drawnCard.value} suit={drawnCard.suit} />
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
