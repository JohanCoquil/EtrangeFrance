import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { Provider as JotaiProvider } from 'jotai';
import React, { useEffect } from 'react';
import './global.css';
import { initDb, resetDb } from './src/data/db';
import { Alert } from "react-native";

export default function App() {
  useEffect(() => {
    Alert.alert(
      "Supprimer la BDD locale ?",
      "Voulez-vous réinitialiser toutes les données locales ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDb();
              alert("✅ Base locale supprimée !");
            } catch (error) {
              alert("❌ Erreur lors de la suppression : " + error);
            }
          },
        },
      ]
    );

    initDb();
  }, []);

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
