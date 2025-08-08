import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import AuthScreen from '../screens/AuthScreen';
import CreateCharacterScreen from '../screens/CreateCharacterScreen';
import ChooseProfessionScreen from '../screens/ChooseProfessionScreen';
import ChooseHobbieScreen from '../screens/ChooseHobbieScreen';
import ChooseStrangePathScreen from '../screens/ChooseStrangePathScreen';
import { RootStackParamList } from './types';
import DeckScreen from '../screens/DeckScreen';
import CardDrawScreen from '../screens/CardDrawScreen';
import CharacterSheet from '../screens/CharacterSheet';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="CreateCharacter" component={CreateCharacterScreen} />
      <Stack.Screen name="ChooseProfession" component={ChooseProfessionScreen} />
      <Stack.Screen name="ChooseHobbie" component={ChooseHobbieScreen} />
      <Stack.Screen name="ChooseStrangePath" component={ChooseStrangePathScreen} />
      <Stack.Screen name="Deck" component={DeckScreen} />
      <Stack.Screen name="CardDraw" component={CardDrawScreen} />
      <Stack.Screen name="CharacterSheet" component={CharacterSheet} />
    </Stack.Navigator>
  );
}
