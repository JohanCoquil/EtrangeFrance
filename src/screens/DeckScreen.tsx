// src/screens/DeckScreen.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import Card from '../components/game/Carte';
import { suits, values } from '../data/deck';

export default function DeckScreen() {
  return (
    <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 10 }}>
      {suits.map((suit) =>
        values.map((value) => (
          <View key={suit.symbol + value} style={{ margin: 8 }}>
            <Card value={value} suit={suit} />
          </View>
        ))
      )}
    </ScrollView>
  );
}