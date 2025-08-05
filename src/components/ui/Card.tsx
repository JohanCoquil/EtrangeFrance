import { View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  className?: string;
  style?: ViewStyle;
}

export default function Card({
  children,
  variant = 'default',
  className = '',
  style
}: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white rounded-xl p-4 shadow-lg';
      case 'outline':
        return 'bg-white rounded-xl p-4 border border-gray-200';
      default:
        return 'bg-white rounded-xl p-4 shadow-sm';
    }
  };

  return (
    <View
      className={`${getVariantStyles()} ${className}`}
      style={style}
    >
      {children}
    </View>
  );
} 