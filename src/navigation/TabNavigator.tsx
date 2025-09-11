import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';
import HomeScreen from '../screens/HomeScreen';
import CharactersScreen from '../screens/CharactersScreen';
import AgencyScreen from '../screens/AgencyScreen';
import ScenariosNavigator from './ScenariosNavigator';
import DeckScreen from '../screens/DeckScreen';
import ParamScreen from '../screens/ParamScreen';
import { Settings } from 'lucide-react-native';
import { usePlayMusic } from '@/context/PlayMusicContext';

export type TabParamList = {
  Home: undefined;
  Characters: undefined;
  Agency: undefined;
  Scenarios: undefined;
  Deck: undefined;
  Param: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function HeaderButtons({
  onLogout,
  showLogout,
}: {
  onLogout?: () => void;
  showLogout: boolean;
}) {
  const { musicEnabled, setMusicEnabled } = usePlayMusic();

  return (
    <View style={{ flexDirection: 'row', marginRight: 16 }}>
      <TouchableOpacity
        onPress={() => setMusicEnabled(!musicEnabled)}
        style={{ marginRight: showLogout ? 16 : 0 }}
      >
          <Ionicons
            name={musicEnabled ? 'volume-high' : 'volume-mute'}
            size={12}
            color="#ffffff"
          />
      </TouchableOpacity>
      {showLogout && (
        <TouchableOpacity onPress={onLogout}>
          <Ionicons name="log-out-outline" size={12} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function TabNavigator() {
  const [user, setUser] = useState<{ id: number; login: string } | null>(
    null
  );

  useEffect(() => {
    const loadUser = async () => {
      const stored = await SecureStore.getItemAsync('user');
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  const confirmLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', onPress: handleLogout },
    ]);
  };

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
        options={{
          title: user?.login || 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: () => null, // Vous pouvez ajouter des icônes plus tard
          headerRight: () => (
            <HeaderButtons
              showLogout={!!user}
              onLogout={confirmLogout}
            />
          ),
        }}
      >
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Characters"
        component={CharactersScreen}
        options={{
          title: 'Personnages',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="Agency"
        component={AgencyScreen}
        options={{
          title: 'Agence',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="Scenarios"
        component={ScenariosNavigator}
        options={{
          title: 'Scénarios',
          tabBarIcon: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Deck"
        component={DeckScreen}
        options={{
          title: 'Deck',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="Param"
        component={ParamScreen}
        options={{
          title: '',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size / 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}