import { View, ScrollView } from 'react-native';
import { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface LayoutProps {
  children: ReactNode;
  variant?: 'default' | 'centered' | 'scroll';
  className?: string;
  showSafeArea?: boolean;
  backgroundColor?: 'light' | 'dark' | 'gray' | 'gradient';
}

export default function Layout({
  children,
  variant = 'default',
  className = '',
  showSafeArea = true,
  backgroundColor = 'light',
}: LayoutProps) {
  const insets = useSafeAreaInsets();

  const getBackgroundColor = () => {
    switch (backgroundColor) {
      case 'light':
        return 'bg-white';
      case 'dark':
        return 'bg-gray-900';
      case 'gray':
        return 'bg-gray-100';
      default:
        return '';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'centered':
        return 'flex-1 justify-center items-center';
      case 'scroll':
        return 'flex-1';
      default:
        return 'flex-1';
    }
  };

  const paddingTop = showSafeArea ? insets.top : 0;
  const paddingBottom = showSafeArea ? insets.bottom : 0;

  const contentPaddingBottom = paddingBottom + 32; // add extra space for scrolling

  const Container = variant === 'scroll' ? ScrollView : View;

  // Si gradient, on utilise LinearGradient
  if (backgroundColor === 'gradient') {
    return (
      <LinearGradient
        colors={['#0f2027', '#203a43', '#2c5364']} // tu peux changer les couleurs ici
        style={{ flex: 1, paddingTop, paddingBottom }}
      >
        <Container
          className={`${getVariantStyles()} ${className}`}
          contentContainerStyle=
            {variant === 'scroll' ? { flexGrow: 1, paddingBottom: contentPaddingBottom } : undefined}
        >
          {children}
        </Container>
      </LinearGradient>
    );
  }

  // Sinon, comportement classique
  return (
    <Container
      style={{ paddingTop, paddingBottom }}
      className={`${getBackgroundColor()} ${getVariantStyles()} ${className}`}
      contentContainerStyle=
        {variant === 'scroll' ? { flexGrow: 1, paddingBottom: contentPaddingBottom } : undefined}
    >
      {children}
    </Container>
  );
}
