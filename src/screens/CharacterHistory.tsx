import React from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Title, Caption, Body } from '../components/ui';

export default function CharacterHistory() {
  return (
    <View className="flex-1 bg-gradient-to-b from-black via-gray-900 to-purple-950">
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Titre principal */}
        <View className="mb-6">
          <Title className="text-center text-3xl font-bold text-purple-300 tracking-widest">
            HISTORIQUE & NOTES
          </Title>
          <Caption className="text-center text-purple-200 mt-1">
            Secrets, Alliances & Révélations
          </Caption>
        </View>

        {/* Backstory */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-purple-600">
          <Title className="text-purple-300 text-xl font-semibold mb-3">
            Origines & Parcours
          </Title>
          <TextInput
            placeholder="Décrivez l'origine et l'histoire de votre personnage..."
            placeholderTextColor="#aaa"
            multiline
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              borderRadius: 10,
              padding: 12,
              minHeight: 150,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Rencontres & Alliés */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-indigo-600">
          <Title className="text-indigo-300 text-xl font-semibold mb-3">
            Rencontres & Alliés
          </Title>
          <Body className="text-white mb-2">🔮 Mentor Occultiste</Body>
          <Body className="text-white mb-2">🕵️ Collègue enquêteur</Body>
          <Body className="text-white">👤 Informateur mystérieux</Body>
        </View>

        {/* Notes secrètes */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-red-600">
          <Title className="text-red-300 text-xl font-semibold mb-3">
            Notes Secrètes
          </Title>
          <TextInput
            placeholder="Vos réflexions, hypothèses et indices cachés..."
            placeholderTextColor="#aaa"
            multiline
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              borderRadius: 10,
              padding: 12,
              minHeight: 120,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Indices collectés */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-yellow-600">
          <Title className="text-yellow-300 text-xl font-semibold mb-3">
            Indices Collectés
          </Title>
          <View className="flex-row flex-wrap gap-2">
            <Body className="bg-yellow-600/40 text-yellow-200 px-3 py-1 rounded-full">
              Lettre Anonyme
            </Body>
            <Body className="bg-yellow-600/40 text-yellow-200 px-3 py-1 rounded-full">
              Photographie Floue
            </Body>
            <Body className="bg-yellow-600/40 text-yellow-200 px-3 py-1 rounded-full">
              Voix Étrange
            </Body>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-6">
          <Caption className="text-gray-500 text-center">
            Étrange France © 2025 - Dossier confidentiel
          </Caption>
        </View>
      </ScrollView>
    </View>
  );
}