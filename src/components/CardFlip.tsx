import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Animated, View, StyleProp, ViewStyle } from "react-native";

export interface CardFlipRef {
  flip: () => void;
}

interface CardFlipProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Minimal card flip component with a simple page flip animation
 * between its first and second child.
 */
const CardFlip = forwardRef<CardFlipRef, CardFlipProps>(
  ({ children, style }, ref) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [flipped, setFlipped] = useState(false);

    const animateTo = (toValue: number) =>
      Animated.timing(animatedValue, {
        toValue,
        duration: 400,
        useNativeDriver: true,
      }).start();

    useImperativeHandle(ref, () => ({
      flip: () => {
        const toValue = flipped ? 0 : 180;
        setFlipped(!flipped);
        animateTo(toValue);
      },
    }));

    const childArray = React.Children.toArray(children);

    const frontAnimatedStyle: StyleProp<ViewStyle> = {
      transform: [
        { perspective: 1000 },
        {
          rotateY: animatedValue.interpolate({
            inputRange: [0, 180],
            outputRange: ["0deg", "180deg"],
          }),
        },
      ],
      backfaceVisibility: "hidden",
      position: "absolute",
      width: "100%" as const,
      height: "100%" as const,
    } as any;

    const backAnimatedStyle: StyleProp<ViewStyle> = {
      transform: [
        { perspective: 1000 },
        {
          rotateY: animatedValue.interpolate({
            inputRange: [0, 180],
            outputRange: ["180deg", "360deg"],
          }),
        },
      ],
      backfaceVisibility: "hidden",
      position: "absolute",
      width: "100%" as const,
      height: "100%" as const,
    } as any;

    return (
      <View style={style}>
        <Animated.View
          style={frontAnimatedStyle}
          pointerEvents={flipped ? "none" : "auto"}
        >
          {childArray[0] ?? null}
        </Animated.View>
        <Animated.View
          style={backAnimatedStyle}
          pointerEvents={flipped ? "auto" : "none"}
        >
          {childArray[1] ?? null}
        </Animated.View>
      </View>
    );
  },
);

export default CardFlip;
