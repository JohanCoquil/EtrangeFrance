// src/components/FlippableCard.tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

type Suit = {
  symbol: string;
  color: string;
};

type Props = {
  value: string;
  suit: Suit;
};

export default function FlippableCard({ value, suit }: Props) {
  const [flipped, setFlipped] = useState(false);
  const rotateY = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 }, // ✅ ici et non dans styles.card
      { rotateY: `${rotateY.value}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 }, // ✅ idem
      { rotateY: `${rotateY.value + 180}deg` },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
  }));

  const handleFlip = () => {
    setFlipped(!flipped);
    rotateY.value = withTiming(flipped ? 0 : 180, { duration: 500 });
  };

  return (
    <Pressable onPress={handleFlip}>
      <View style={styles.card}>
        {/* Face avant */}
        <Animated.View style={[styles.face, frontStyle]}>
          <Text style={[styles.value, { color: suit.color }]}>
            {value}
          </Text>
          <Text style={[styles.suit, { color: suit.color }]}>
            {suit.symbol}
          </Text>
        </Animated.View>

        {/* Dos de la carte */}
        <Animated.View style={[styles.face, styles.back, backStyle]}>
          <Text style={styles.backText}>Étrange France</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 200,
    borderRadius: 15,
  },
  face: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  suit: {
    fontSize: 28,
    marginTop: 10,
  },
  back: {
    backgroundColor: '#1f2937',
    borderColor: '#555',
  },
  backText: {
    color: '#bbb',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
