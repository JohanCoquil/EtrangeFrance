import React from 'react';
import { View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Layout, Title, Body } from '../components/ui';
import { RootStackParamList } from '../navigation/types';
import { useCharacters } from '@/api/charactersLocal';
import { useCharacterCapacites } from '@/api/capacitiesLocal';

export default function CharacterSheet() {
  const route = useRoute<RouteProp<RootStackParamList, 'CharacterSheet'>>();
  const { characterId } = route.params;
  const { data: characters, isLoading } = useCharacters();
  const character: any = characters?.find((c: any) => c.id === characterId);
  const { data: capacites } = useCharacterCapacites(characterId);

  if (isLoading) {
    return (
      <Layout backgroundColor="gradient" className="px-4 py-6">
        <Body className="text-white">Chargement...</Body>
      </Layout>
    );
  }

  if (!character) {
    return (
      <Layout backgroundColor="gradient" className="px-4 py-6">
        <Body className="text-white">Personnage introuvable.</Body>
      </Layout>
    );
  }

  const stats = [
    { label: 'Force', value: character.force },
    { label: 'Dextérité', value: character.dexterite },
    { label: 'Intelligence', value: character.intelligence },
    { label: 'Charisme', value: character.charisme },
    { label: 'Mémoire', value: character.memoire },
    { label: 'Volonté', value: character.volonte },
    { label: 'Santé', value: character.sante },
  ];

  return (
    <Layout backgroundColor="gradient" variant="scroll" className="px-4 py-6">
      <View className="mb-6">
        <Title className="text-center text-3xl font-bold text-white tracking-widest">
          {character.name}
        </Title>
      </View>

      <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-blue-600">
        <Title className="text-white text-xl font-semibold mb-3">
          Caractéristiques
        </Title>
        {stats.map((stat) => (
          <View key={stat.label} className="flex-row justify-between mb-1">
            <Body className="text-white">{stat.label}</Body>
            <Body className="text-white">{stat.value}</Body>
          </View>
        ))}
      </View>

      <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-green-600">
        <Title className="text-green-300 text-xl font-semibold mb-3">
          Métier & Spécialités
        </Title>
        {character.profession_name ? (
          <View className="flex-row justify-between">
            <Body className="text-white">{character.profession_name}</Body>
            <Body className="text-white">{character.profession_score}</Body>
          </View>
        ) : (
          <Body className="text-white">Aucun</Body>
        )}
      </View>

      <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-orange-600">
        <Title className="text-orange-300 text-xl font-semibold mb-3">
          Hobbies
        </Title>
        {character.hobby_name ? (
          <View className="flex-row justify-between">
            <Body className="text-white">{character.hobby_name}</Body>
            <Body className="text-white">{character.hobby_score}</Body>
          </View>
        ) : (
          <Body className="text-white">Aucun</Body>
        )}
      </View>

      <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-purple-600">
        <Title className="text-purple-300 text-xl font-semibold mb-3">
          Voie étrange
        </Title>
        {character.voie_name ? (
          <>
            <View className="flex-row justify-between">
              <Body className="text-white">{character.voie_name}</Body>
              <Body className="text-white">{character.voie_score}</Body>
            </View>
            {capacites && capacites.length > 0 ? (
              capacites.map((cap: any) => (
                <View
                  key={cap.id}
                  className="flex-row justify-between ml-4 mt-1"
                >
                  <Body className="text-purple-200">{cap.name}</Body>
                  <Body className="text-purple-200">{cap.level}</Body>
                </View>
              ))
            ) : (
              <Body className="text-white">Aucune capacité</Body>
            )}
          </>
        ) : (
          <Body className="text-white">Aucune</Body>
        )}
      </View>

      <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-yellow-600">
        <Title className="text-yellow-300 text-xl font-semibold mb-3">
          Équipement
        </Title>
      </View>
    </Layout>
  );
}
