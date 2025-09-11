import { View, Text, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ParamScreen() {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const loadDebugMode = async () => {
      try {
        const stored = await AsyncStorage.getItem('debugMode');
        if (stored !== null) {
          setDebugMode(stored === 'true');
        }
      } catch (e) {
        // ignore
      }
    };
    loadDebugMode();
  }, []);

  const toggleDebugMode = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('debugMode', value ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
    setDebugMode(value);
  };

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-lg font-semibold mb-4">Paramètres</Text>
      <View className="flex-row items-center">
        <Text className="mr-2">Debug Mode</Text>
        <Switch value={debugMode} onValueChange={toggleDebugMode} />
      </View>
    </View>
  );
}
