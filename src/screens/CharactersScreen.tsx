import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types"; // ton fichier types.ts
import { useCharacters, useDeleteCharacter } from "@/api/charactersLocal";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";

// On précise : je suis dans l'écran "Characters" du RootStack
type CharactersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Characters"
>;

export default function CharactersScreen() {
  const navigation = useNavigation<CharactersScreenNavigationProp>();
  const { data: characters, isLoading } = useCharacters();
  const deleteCharacter = useDeleteCharacter();

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        {isLoading ? (
          <Text className="text-white text-center">Chargement...</Text>
        ) : (
          <ScrollView>
            {characters?.map((char: any) => (
              <View
                key={char.id}
                className="bg-white/10 p-3 rounded-lg mb-3"
              >
                <Text className="text-white text-lg font-semibold">
                  {char.name}
                </Text>
                <Text className="text-white text-sm italic mb-2">
                  {char.species}
                </Text>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={() => deleteCharacter.mutate(char.id)}
                >
                  Supprimer
                </Button>
              </View>
            ))}
          </ScrollView>
        )}

        <View className="mt-4">
          <Button
            variant="primary"
            size="md"
            onPress={() => navigation.navigate("CreateCharacter")}
          >
            Créer un personnage
          </Button>
        </View>
      </View>
    </Layout>
  );
}
