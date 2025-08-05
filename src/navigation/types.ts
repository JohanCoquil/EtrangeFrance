import { TabParamList } from './TabNavigator';

export type RootStackParamList = {
  MainTabs: { screen?: keyof TabParamList };
  Auth: undefined;
  CreateCharacter: undefined;
  ChooseProfession: { characterId: string };
  Characters: undefined;
  Deck: undefined;
  CardDraw: undefined;
  // Ajoutez d'autres écrans modaux ou stack ici si nécessaire
};

// Ré-export des types de tabs pour faciliter l'utilisation
export type { TabParamList } from './TabNavigator';