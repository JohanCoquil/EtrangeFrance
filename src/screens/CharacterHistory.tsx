import React from 'react';
import { TextInput, View, PanResponder, Animated } from 'react-native';
import { Layout, Title, Caption } from '../components/ui';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export default function CharacterHistory() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CharacterHistory'>>();
  const { characterId } = route.params;
  const flipAnim = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 20,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 50) {
          Animated.timing(flipAnim, {
            toValue: -1,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            flipAnim.setValue(0);
            navigation.navigate('CharacterSheet', { characterId });
          });
        }
      },
    })
  ).current;
  const rotateY = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-180deg', '0deg', '180deg'],
  });
  return (
    <Animated.View
      className="flex-1"
      style={{ transform: [{ rotateY }] }}
      {...panResponder.panHandlers}
    >
      <Layout backgroundColor="gradient" variant="scroll" className="px-4 py-6">
        {/* Titre principal */}
        <View className="mb-6">
          <Title className="text-center text-3xl font-bold text-purple-300 tracking-widest">
            HISTORIQUE & NOTES
          </Title>
        </View>

        {/* Backstory */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-purple-600">
          <Title className="text-purple-300 text-xl font-semibold mb-3">
            Origines & Parcours
          </Title>
          <TextInput
            placeholder="Décrivez l'origine et l'histoire de votre personnage..."
            placeholderTextColor="#aaa"
            multiline
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              borderRadius: 10,
              padding: 12,
              minHeight: 150,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Rencontres & Alliés */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-indigo-600">
          <Title className="text-indigo-300 text-xl font-semibold mb-3">
            Rencontres & Alliés
          </Title>
          <TextInput
            placeholder="Listez les rencontres marquantes et vos alliés..."
            placeholderTextColor="#aaa"
            multiline
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              borderRadius: 10,
              padding: 12,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Notes */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-red-600">
          <Title className="text-red-300 text-xl font-semibold mb-3">Notes</Title>
          <TextInput
            placeholder="Vos réflexions, hypothèses..."
            placeholderTextColor="#aaa"
            multiline
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              borderRadius: 10,
              padding: 12,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Effets déclenchés / Objets fétiches */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-teal-600">
          <Title className="text-teal-300 text-xl font-semibold mb-3">
            Effets déclenchés / Objets fétiches
          </Title>
          <TextInput
            placeholder="Décrivez les effets spéciaux ou vos objets fétiches..."
            placeholderTextColor="#aaa"
            multiline
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              borderRadius: 10,
              padding: 12,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Footer */}
        <View className="mt-6">
          <Caption className="text-gray-500 text-center">
            Étrange France © 2025 - Dossier confidentiel
          </Caption>
        </View>
      </Layout>
    </Animated.View>
  );
}
