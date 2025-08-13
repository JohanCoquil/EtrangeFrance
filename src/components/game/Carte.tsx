// src/components/game/Carte.tsx
import React from 'react';
import { Svg, Rect, Text, Line } from 'react-native-svg';

type CardProps = {
  value: string;
  suit: { symbol: string; color: string };
  crossed?: boolean;
};

export default function Card({ value, suit, crossed = false }: CardProps) {
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

      {/* Croix rouge si la carte est ignorée */}
      {crossed && (
        <>
          <Line x1="0" y1="0" x2="140" y2="200" stroke="red" strokeWidth="6" />
          <Line x1="140" y1="0" x2="0" y2="200" stroke="red" strokeWidth="6" />
        </>
      )}
    </Svg>
  );
}
