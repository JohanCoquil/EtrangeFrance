import React from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { Title, Caption, Body } from '../components/ui';

export default function CharacterSheet() {
  return (
    <View className="flex-1 bg-gradient-to-b from-black via-gray-900 to-blue-950">
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Titre principal */}
        <View className="mb-6">
          <Title className="text-center text-3xl font-bold text-blue-300 tracking-widest">
            FICHE DE PERSONNAGE
          </Title>
          <Caption className="text-center text-blue-200 mt-1">
            Étrange France - Années 80
          </Caption>
        </View>

        {/* Section Caractéristiques */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-blue-600">
          <Title className="text-blue-300 text-xl font-semibold mb-3">
            Caractéristiques
          </Title>

          {[
            { label: 'FORCE', value: 0.7 },
            { label: 'DEXTÉRITÉ', value: 0.5 },
            { label: 'INTELLIGENCE', value: 0.8 },
            { label: 'CHARISME', value: 0.6 },
          ].map((stat, index) => (
            <View key={index} className="mb-3">
              <Body className="text-white mb-1">{stat.label}</Body>
              <ProgressBar progress={stat.value} color="#00ffd5" style={{ height: 8, borderRadius: 4 }} />
            </View>
          ))}
        </View>

        {/* Section Métier */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-green-600">
          <Title className="text-green-300 text-xl font-semibold mb-3">
            Métier & Spécialités
          </Title>
          <Body className="text-white">Agent de terrain</Body>
          <Caption className="text-gray-400">+25 Combat, +15 Athlétisme</Caption>
        </View>

        {/* Section Notes */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-purple-600">
          <Title className="text-purple-300 text-xl font-semibold mb-3">
            Notes & Affaires classées
          </Title>
          <TextInput
            placeholder="Écrivez vos notes ici..."
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

        {/* Section Équipement */}
        <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-yellow-600">
          <Title className="text-yellow-300 text-xl font-semibold mb-3">
            Équipement
          </Title>
          <Body className="text-white">🔫 Pistolet de service</Body>
          <Body className="text-white">📖 Carnet d’enquêteur</Body>
          <Body className="text-white">🧿 Amulette protectrice</Body>
        </View>

        {/* Footer */}
        <View className="mt-6">
          <Caption className="text-gray-500 text-center">
            Étrange France © 2025 - Fiche interactive
          </Caption>
        </View>
      </ScrollView>
    </View>
  );
}