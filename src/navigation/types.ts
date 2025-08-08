import { TabParamList } from './TabNavigator';

export type RootStackParamList = {
  MainTabs: { screen?: keyof TabParamList };
  Auth: undefined;
  CreateCharacter: undefined;
  ChooseProfession: { characterId: string };
  ChooseHobbie: { characterId: string };
  ChooseStrangePath: { characterId: string };
  Characters: undefined;
  Deck: undefined;
  CardDraw: undefined;
  CharacterSheet: { characterId: string };
  // Ajoutez d'autres écrans modaux ou stack ici si nécessaire
};

// Ré-export des types de tabs pour faciliter l'utilisation
export type { TabParamList } from './TabNavigator';
