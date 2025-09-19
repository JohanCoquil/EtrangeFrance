import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useCharacters } from '@/api/charactersLocal';
import Button from '@/components/ui/Button';
import { User, X } from 'lucide-react-native';

type Character = {
  id: string;
  name: string;
  profession_name?: string;
  hobby_name?: string;
  voie_name?: string;
  divinity_name?: string;
  intelligence: number;
  force: number;
  dexterite: number;
  charisme: number;
  memoire: number;
  volonte: number;
  sante: number;
  degats: number;
};

type CharacterSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectCharacter: (character: Character) => void;
  title?: string;
  subtitle?: string;
};

export default function CharacterSelectionModal({
  visible,
  onClose,
  onSelectCharacter,
  title = "Choisir un personnage",
  subtitle = "Sélectionnez le personnage avec lequel vous voulez rejoindre la session"
}: CharacterSelectionModalProps) {
  const { data: characters, isLoading, error } = useCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const handleConfirm = () => {
    if (selectedCharacter) {
      onSelectCharacter(selectedCharacter);
      setSelectedCharacter(null);
    }
  };

  const handleClose = () => {
    setSelectedCharacter(null);
    onClose();
  };

  const renderCharacterCard = (character: Character) => {
    const isSelected = selectedCharacter?.id === character.id;

    return (
      <TouchableOpacity
        key={character.id}
        className={`p-4 rounded-xl mb-3 border-2 ${isSelected
          ? 'bg-blue-500/20 border-blue-400'
          : 'bg-white/10 border-white/20'
          }`}
        onPress={() => setSelectedCharacter(character)}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold mb-1">
              {character.name}
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-2">
              {character.profession_name && (
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs">
                    {character.profession_name}
                  </Text>
                </View>
              )}
              {character.hobby_name && (
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs">
                    {character.hobby_name}
                  </Text>
                </View>
              )}
              {character.voie_name && (
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs">
                    {character.voie_name}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-between">
              <View className="flex-row gap-3">
                <View className="items-center">
                  <Text className="text-white/80 text-xs">INT</Text>
                  <Text className="text-white text-sm font-semibold">
                    {character.intelligence}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-white/80 text-xs">FOR</Text>
                  <Text className="text-white text-sm font-semibold">
                    {character.force}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-white/80 text-xs">DEX</Text>
                  <Text className="text-white text-sm font-semibold">
                    {character.dexterite}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-white/80 text-xs">CHA</Text>
                  <Text className="text-white text-sm font-semibold">
                    {character.charisme}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-white/80 text-xs">Santé</Text>
                <Text className="text-white text-sm font-semibold">
                  {character.sante - character.degats}/{character.sante}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-gray-900">
        <View className="flex-row items-center justify-between p-4 border-b border-white/10">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-white/80 text-sm mt-1">
                {subtitle}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClose}>
            <X color="#ffffff" size={24} />
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-4">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-white mt-4">Chargement des personnages...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-red-300 text-center mb-4">
                Erreur lors du chargement des personnages
              </Text>
              <Button variant="primary" size="md" onPress={handleClose}>
                Fermer
              </Button>
            </View>
          ) : !characters || characters.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <User color="#ffffff80" size={48} />
              <Text className="text-white text-lg text-center mb-2 mt-4">
                Aucun personnage
              </Text>
              <Text className="text-white/80 text-center mb-6">
                Vous devez créer un personnage avant de pouvoir rejoindre une session.
              </Text>
              <Button variant="primary" size="md" onPress={handleClose}>
                Fermer
              </Button>
            </View>
          ) : (
            <>
              <ScrollView className="flex-1 mb-4">
                {characters.map((character: any) => renderCharacterCard(character))}
              </ScrollView>

              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onPress={handleClose}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onPress={handleConfirm}
                  disabled={!selectedCharacter}
                >
                  Confirmer
                </Button>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
