// src/components/Card.tsx
import React from 'react';
import { Svg, Rect, Text } from 'react-native-svg';

type CardProps = {
  value: string;
  suit: { symbol: string; color: string };
};

export default function Card({ value, suit }: CardProps) {
  return (
    <Svg height="200" width="140">
      {/* Fond de la carte */}
      <Rect
        width="140"
        height="200"
        rx="15"
        ry="15"
        fill="#111827" // gris très foncé
        stroke={suit.color}
        strokeWidth="3"
      />

      {/* Valeur + symbole haut gauche */}
      <Text
        x="20"
        y="40"
        fill={suit.color}
        fontSize="24"
        fontWeight="bold"
      >
        {value}{suit.symbol}
      </Text>

      {/* Symbole central */}
      <Text
        x="70"
        y="120"
        textAnchor="middle"
        fill={suit.color}
        fontSize="60"
      >
        {suit.symbol}
      </Text>
    </Svg>
  );
}
