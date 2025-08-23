import React, { useState } from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
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

// Conversion de millimètres en unités indépendantes de la densité
const mmToDp = (mm: number) => (mm * 160) / 25.4;
const RESULT_OFFSET = mmToDp(50);

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
  const route = useRoute<RouteProp<RootStackParamList, 'CardDraw'>>();
  const { difficulty, statName, statValue = 0, extraName, extraValue = 0 } =
    route.params;
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<
    { value: string; suit: { symbol: string; color: string } }[] | null
  >(null);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [randomFactors, setRandomFactors] = useState(generateRandomFactors);
  const [mode, setMode] = useState<'classic' | 'advantage' | 'disadvantage'>('classic');
  const [cardValue, setCardValue] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);

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
  const cardValues: Record<string, number> = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  const handlePress = () => {
    if (!isShuffling && !drawnCards) {
      setRandomFactors(generateRandomFactors());
      setIsShuffling(true);
      translateX.value = withRepeat(withTiming(15, { duration: 150 }), -1, true);
    } else if (isShuffling) {
      setIsShuffling(false);
      cancelAnimation(translateX);
      translateX.value = 0;

      const card1 = drawRandomCard();
      if (mode === 'classic') {
        setDrawnCards([card1]);
        setChosenIndex(0);
        const cv = cardValues[card1.value];
        setCardValue(cv);
        setResult(cv + statValue + extraValue);
      } else {
        const card2 = drawRandomCard();
        const rank1 = valueOrder.indexOf(card1.value);
        const rank2 = valueOrder.indexOf(card2.value);
        const chosen =
          mode === 'advantage'
            ? rank1 >= rank2
              ? 0
              : 1
            : rank1 <= rank2
              ? 0
              : 1;
        setDrawnCards([card1, card2]);
        setChosenIndex(chosen);
        const cv = chosen === 0 ? cardValues[card1.value] : cardValues[card2.value];
        setCardValue(cv);
        setResult(cv + statValue + extraValue);
      }
    } else if (drawnCards) {
      setDrawnCards(null);
      setChosenIndex(null);
       setCardValue(null);
       setResult(null);
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

        {drawnCards && (
          <View style={styles.drawnCardsContainer}>
            {drawnCards.map((card, index) => (
              <View key={index} style={styles.singleCard}>
                <Card
                  value={card.value}
                  suit={card.suit}
                  crossed={drawnCards.length > 1 && index !== chosenIndex}
                />
              </View>
            ))}
          </View>
        )}
      </Pressable>
      {result !== null && cardValue !== null && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{`${[
            `Carte: ${cardValue}`,
            statName ? `${statName}: ${statValue}` : null,
            extraName ? `${extraName}: ${extraValue}` : null,
          ]
            .filter(Boolean)
            .join(' + ')} = ${result}`}</Text>
          <Text
            style={[styles.resultText, {
              color: result >= difficulty ? '#22c55e' : '#ef4444',
            }]}
          >
            {result >= difficulty ? 'REUSSITE' : 'ECHEC'} (Difficulté {difficulty})
          </Text>
        </View>
      )}
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
  drawnCardsContainer: {
    marginTop: -240,
    flexDirection: 'row',
  },
  singleCard: { marginHorizontal: 10 },
  resultBox: {
    position: 'absolute',
    bottom: 20 + RESULT_OFFSET,
    left: 20,
    right: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
