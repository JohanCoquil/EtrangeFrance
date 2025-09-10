// App.tsx
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import RootNavigator from '@/navigation/RootNavigator';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { Provider as JotaiProvider } from 'jotai';
import React, { useEffect, useState } from 'react';
import './global.css';
import { initDb, resetDb } from '@/data/db';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PlayMusicProvider, usePlayMusic } from '@/context/PlayMusicContext';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    Alert.alert(
      "Supprimer la BDD locale ?",
      "Voulez-vous réinitialiser toutes les données locales ?",
      [
        {
          text: "Non",
          style: "cancel",
          onPress: async () => {
            await initDb();
            setDbReady(true);
          },
        },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDb();
              alert("✅ Base locale supprimée !");
            } catch (error) {
              alert("❌ Erreur lors de la suppression : " + error);
            } finally {
              setDbReady(true);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <PlayMusicProvider>
            <NavigationWithMusic />
          </PlayMusicProvider>
        </QueryClientProvider>
      </JotaiProvider>
    </GestureHandlerRootView>
  );
}

function NavigationWithMusic() {
  const navigationRef = useNavigationContainerRef();
  const { setPlayMusic } = usePlayMusic();

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const name = navigationRef.getCurrentRoute()?.name;
        setPlayMusic(name !== 'Scenarios');
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}
