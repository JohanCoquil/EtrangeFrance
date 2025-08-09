import React, {
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

export interface CardFlipRef {
  flip: () => void;
}

interface CardFlipProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Minimal replacement for the react-native-card-flip library.
 * It simply toggles between the first and second child when `flip`
 * is called without any animation. This keeps the bundler happy
 * without pulling an additional dependency.
 */
const CardFlip = forwardRef<CardFlipRef, CardFlipProps>(
  ({ children, style }, ref) => {
    const [index, setIndex] = useState(0);

    useImperativeHandle(ref, () => ({
      flip: () => setIndex((prev) => (prev === 0 ? 1 : 0)),
    }));

    const childArray = React.Children.toArray(children);

    return <View style={style}>{childArray[index] ?? null}</View>;
  }
);

export default CardFlip;

