import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CharactersScreen from '../screens/CharactersScreen';
import AgencyScreen from '../screens/AgencyScreen';
import SessionScreen from '../screens/SessionScreen';
import DeckScreen from '../screens/DeckScreen';
import CardDrawScreen from '../screens/CardDrawScreen';

export type TabParamList = {
  Home: undefined;
  Characters: undefined;
  Agency: undefined;
  Session: undefined;
  Deck: undefined;
  CardDraw: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1f2937', // bg-gray-800
          borderTopColor: '#374151', // border-gray-700
        },
        tabBarActiveTintColor: '#3b82f6', // text-blue-500
        tabBarInactiveTintColor: '#9ca3af', // text-gray-400
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#ffffff',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Accueil',
          tabBarIcon: () => null // Vous pouvez ajouter des icônes plus tard
        }}
      />
      <Tab.Screen
        name="Characters"
        component={CharactersScreen}
        options={{
          title: 'Personnages',
          tabBarIcon: () => null
        }}
      />
      <Tab.Screen
        name="Agency"
        component={AgencyScreen}
        options={{
          title: 'Agence',
          tabBarIcon: () => null
        }}
      />
      <Tab.Screen
        name="Session"
        component={SessionScreen}
        options={{
          title: 'Session',
          tabBarIcon: () => null
        }}
      />
      <Tab.Screen
        name="Deck"
        component={DeckScreen}
        options={{
          title: 'Deck',
          tabBarIcon: () => null
        }}
      />
      <Tab.Screen
        name="CardDraw"
        component={CardDrawScreen}
        options={{
          title: 'CardDraw',
          tabBarIcon: () => null
        }}
      />
    </Tab.Navigator>
  );
} 