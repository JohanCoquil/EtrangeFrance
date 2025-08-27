import { TabParamList } from './TabNavigator';

export type RootStackParamList = {
  MainTabs: { screen?: keyof TabParamList };
  Auth: undefined;
  CreateCharacter: undefined;
  ChooseProfession: { characterId: string };
  ChooseHobbie: { characterId: string };
  ChooseStrangePath: { characterId: string };
    ChooseVoieCapacities: { characterId: string; voieId: number };
    ChooseDivinity: { characterId: string };
    ChooseBonus: { characterId: string };
    Characters: undefined;
    Deck: undefined;
  CardDraw: {
    difficulty: number;
    statName?: string;
    statValue?: number;
    extraName?: string;
    extraValue?: number;
    characterName: string;
    characterId: string;
  };
  CharacterSheet: { characterId: string };
  // Ajoutez d'autres écrans modaux ou stack ici si nécessaire
};

// Ré-export des types de tabs pour faciliter l'utilisation
export type { TabParamList } from './TabNavigator';
