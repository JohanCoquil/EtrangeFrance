import { Text, TextProps } from 'react-native';
import { ReactNode } from 'react';

interface TypographyProps extends TextProps {
  children: ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'error' | 'success';
  className?: string;
}

export function Typography({
  children,
  variant = 'body',
  className = '',
  ...props
}: TypographyProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'title':
        return 'text-2xl font-bold text-gray-900';
      case 'subtitle':
        return 'text-lg font-semibold text-gray-700';
      case 'body':
        return 'text-base text-gray-600';
      case 'caption':
        return 'text-sm text-gray-500';
      case 'error':
        return 'text-sm text-red-600';
      case 'success':
        return 'text-sm text-green-600';
      default:
        return 'text-base text-gray-600';
    }
  };

  return (
    <Text
      className={`${getVariantStyles()} ${className}`}
      {...props}
    >
      {children}
    </Text>
  );
}

// Composants spécialisés pour plus de commodité
export const Title = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="title" {...props} />
);

export const Subtitle = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="subtitle" {...props} />
);

export const Body = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="body" {...props} />
);

export const Caption = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="caption" {...props} />
);

export const ErrorText = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="error" {...props} />
);

export const SuccessText = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="success" {...props} />
); 