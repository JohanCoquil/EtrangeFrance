import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScenariosScreen from '../screens/ScenariosScreen';
import SelectScenarioScreen from '../screens/SelectScenarioScreen';
import JoinScreen from '../screens/JoinScreen';

export type ScenariosStackParamList = {
  ScenariosList: undefined;
  SelectScenario: undefined;
  Join: undefined;
};

const Stack = createNativeStackNavigator<ScenariosStackParamList>();

export default function ScenariosNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1f2937' },
        headerTintColor: '#ffffff',
      }}
    >
      <Stack.Screen
        name="ScenariosList"
        component={ScenariosScreen}
        options={{ title: 'Scénarios' }}
      />
      <Stack.Screen
        name="SelectScenario"
        component={SelectScenarioScreen}
        options={{ title: 'Choisir un scénario' }}
      />
      <Stack.Screen
        name="Join"
        component={JoinScreen}
        options={{ title: 'Rejoindre une partie' }}
      />
    </Stack.Navigator>
  );
}
