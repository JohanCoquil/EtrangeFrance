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
import { Button } from '../components/ui';

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
  const [mode, setMode] = useState<'classic' | 'advantage' | 'disadvantage'>('classic');

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

  const drawRandomCard = () => ({
    suit: suits[Math.floor(Math.random() * suits.length)],
    value: values[Math.floor(Math.random() * values.length)],
  });

  const valueOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

  const handlePress = () => {
    if (!isShuffling && !drawnCard) {
      setRandomFactors(generateRandomFactors());
      setIsShuffling(true);
      translateX.value = withRepeat(withTiming(15, { duration: 150 }), -1, true);
    } else if (isShuffling) {
      setIsShuffling(false);
      cancelAnimation(translateX);
      translateX.value = 0;

      const card1 = drawRandomCard();
      if (mode === 'classic') {
        setDrawnCard(card1);
      } else {
        const card2 = drawRandomCard();
        const rank1 = valueOrder.indexOf(card1.value);
        const rank2 = valueOrder.indexOf(card2.value);
        if (mode === 'advantage') {
          setDrawnCard(rank1 >= rank2 ? card1 : card2);
        } else {
          setDrawnCard(rank1 <= rank2 ? card1 : card2);
        }
      }
    } else if (drawnCard) {
      setDrawnCard(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeSelector}>
        <Button
          size="sm"
          variant={mode === 'classic' ? 'primary' : 'secondary'}
          onPress={() => setMode('classic')}
          className="mx-1"
        >
          Tirage classique
        </Button>
        <Button
          size="sm"
          variant={mode === 'advantage' ? 'primary' : 'secondary'}
          onPress={() => setMode('advantage')}
          className="mx-1"
        >
          Avantage
        </Button>
        <Button
          size="sm"
          variant={mode === 'disadvantage' ? 'primary' : 'secondary'}
          onPress={() => setMode('disadvantage')}
          className="mx-1"
        >
          Désavantage
        </Button>
      </View>
      <Pressable style={styles.pressableArea} onPress={handlePress}>
        {Array.from({ length: NUM_BACK_CARDS }).map((_, i) => (
          <Animated.View key={i} style={[styles.deck, animStyles[i]]}>
            <View style={styles.cardBack}>
              <Text style={styles.backText}>Étrange France</Text>
            </View>
          </Animated.View>
        ))}

        {drawnCard && (
          <View style={styles.drawnCard}>
            <Card value={drawnCard.value} suit={drawnCard.suit} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pressableArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modeSelector: {
    position: 'absolute',
    top: 40,
    flexDirection: 'row',
    alignSelf: 'center',
    zIndex: 1,
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
