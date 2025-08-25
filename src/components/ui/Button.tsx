import { Pressable, Text } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 active:bg-blue-700';
      case 'secondary':
        return 'bg-gray-600 active:bg-gray-700';
      case 'danger':
        return 'bg-red-600 active:bg-red-700';
      case 'success':
        return 'bg-green-600 active:bg-green-700';
      default:
        return 'bg-blue-600 active:bg-blue-700';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 rounded-lg';
      case 'md':
        return 'px-4 py-3 rounded-xl';
      case 'lg':
        return 'px-6 py-4 rounded-xl';
      default:
        return 'px-4 py-3 rounded-xl';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${getVariantStyles()} ${getSizeStyles()} ${disabled ? 'opacity-50' : ''} flex items-center justify-center ${className}`}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={`text-white text-center font-semibold ${getTextSizeStyles()}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
