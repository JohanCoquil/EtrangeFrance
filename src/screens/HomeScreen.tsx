import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  ImageBackground,
  Animated,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { TabParamList, RootStackParamList } from '../navigation/types';
import { Button, Title, Body, Caption } from '../components/ui';

type Props = BottomTabScreenProps<TabParamList, 'Home'>;

const backgrounds = [
  require('../../assets/illustrations/background.jpg'),
  require('../../assets/illustrations/background2.jpg'),
  require('../../assets/illustrations/background3.jpg'),
  require('../../assets/illustrations/background4.jpg'),
];

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleEnterAgency = () => {
    rootNavigation.navigate('Auth');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      fadeAnim.setValue(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        setNextIndex((nextIndex + 1) % backgrounds.length);
        setIsTransitioning(false);
      });
    }, 7000); // changement toutes les 7 secondes

    return () => clearInterval(interval);
  }, [nextIndex]);

  const ScreenContent = () => (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
        minHeight: screenHeight,
      }}
    >
      <View className="mb-8">
        <Title className="text-white text-center text-4xl font-bold mb-2 tracking-wider">
          ÉTRANGE
        </Title>
        <Title className="text-white text-center text-5xl font-bold tracking-widest">
          FRANCE
        </Title>
        <Caption className="text-white text-center mt-2 tracking-widest uppercase">
          Agences d'Enquêtes Occultes
        </Caption>
      </View>

      <View className="bg-black/40 rounded-lg p-6 mb-8 border border-blue-500/30">
        <Body className="text-white text-center leading-relaxed mb-4">
          Etrange France se déroule dans un monde reflet du notre, où le surnaturel existe.
          Les mages, les fées, les mythes, les dieux anciens le parcourent depuis toujours.
        </Body>
        <Body className="text-blue-100 text-center leading-relaxed mb-4">
          Nous sommes en 1989. La semaine passée, le mur de Berlin est tombé !
          À l'abris des regards, des agences de détectives privés surveillent, enquêtent et règlent les conflits du monde de l'étrange.
        </Body>
        <Caption className="text-gray-300 text-center italic">
          "1989. Le monde change. La technologie change. L'occulte aussi..."
        </Caption>
      </View>

      <Button
        onPress={handleEnterAgency}
        variant="primary"
        className="w-full mb-6 py-4 bg-blue-700 border-2 border-blue-500"
      >
        <Title className="text-white text-lg font-semibold">
          🚪 Entrer dans l'Agence
        </Title>
      </Button>

      <View className="mt-8">
        <Caption className="text-gray-400 text-center">
          Assistant JDR Étrange France • Version 1.0.0
        </Caption>
        <Caption className="text-gray-500 text-center mt-1">
          Le jeu de rôles Étrange France est une création originale de Fletch.
        </Caption>
      </View>

      <Button
        onPress={() => navigation.navigate('Deck')}
        variant="secondary"
        className="w-full bg-purple-800/80 border border-purple-600"
      >
        <Body className="text-purple-200">Jeu de cartes</Body>
      </Button>

      <Button
        onPress={() => navigation.navigate('CardDraw')}
        variant="secondary"
        className="w-full bg-purple-800/80 border border-purple-600"
      >
        <Body className="text-purple-200">Tirage</Body>
      </Button>

    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Image actuelle */}
      <ImageBackground
        source={backgrounds[currentIndex]}
        resizeMode="cover"
        style={{
          position: 'absolute',
          width: screenWidth,
          height: screenHeight,
        }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)']}
          style={{ flex: 1 }}
        />
      </ImageBackground>

      {/* Image de transition */}
      {isTransitioning && (
        <Animated.View
          style={{
            position: 'absolute',
            width: screenWidth,
            height: screenHeight,
            opacity: fadeAnim,
          }}
        >
          <ImageBackground
            source={backgrounds[nextIndex]}
            resizeMode="cover"
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)']}
              style={{ flex: 1 }}
            />
          </ImageBackground>
        </Animated.View>
      )}

      {/* Contenu */}
      <ScreenContent />
    </View>
  );
}
