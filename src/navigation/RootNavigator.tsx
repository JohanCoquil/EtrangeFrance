import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import AuthScreen from '../screens/AuthScreen';
import CreateCharacterScreen from '../screens/CreateCharacterScreen';
import { RootStackParamList } from './types';
import DeckScreen from '../screens/DeckScreen';
import CardDrawScreen from '../screens/CardDrawScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="CreateCharacter" component={CreateCharacterScreen} />
      <Stack.Screen name="Deck" component={DeckScreen} />
      <Stack.Screen name="CardDraw" component={CardDrawScreen} />
    </Stack.Navigator>
  );
}
