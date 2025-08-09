declare module 'react-native-card-flip' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface CardFlipProps extends ViewProps {
    children?: React.ReactNode;
  }

  export default class CardFlip extends React.Component<CardFlipProps> {
    flip(): void;
  }
}
