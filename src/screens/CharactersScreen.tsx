import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, Image } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types"; // ton fichier types.ts
import { useCharacters, useDeleteCharacter } from "@/api/charactersLocal";
import { syncCharacters } from "@/data/characterSync";
import { apiFetch } from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { Download } from "lucide-react-native";

// On précise : je suis dans l'écran "Characters" du RootStack
type CharactersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Characters"
>;

export default function CharactersScreen() {
  const navigation = useNavigation<CharactersScreenNavigationProp>();
  const { data: characters, isLoading } = useCharacters();
  const deleteCharacter = useDeleteCharacter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const queryClient = useQueryClient();
  const formatSync = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "Jamais";

  useEffect(() => {
    const loadUser = async () => {
      const stored = await SecureStore.getItemAsync("user");
      setIsLoggedIn(!!stored);
    };
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadDebug = async () => {
        try {
          const stored = await AsyncStorage.getItem("debugMode");
          setDebugMode(stored === "true");
        } catch {
          setDebugMode(false);
        }
      };
      loadDebug();
    }, []),
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    const hasUnsynced = characters?.some((c: any) => {
      const needsInitialSync = c.distant_id === 0 && c.bonuses;
      const needsAvatarSync =
        c.distant_id !== 0 && c.avatar && (!c.avatar_distant || c.avatar_distant === "");
      return needsInitialSync || needsAvatarSync;
    });
    if (hasUnsynced) {
      syncCharacters()
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["characters"] }),
        )
        .catch((e) => console.error("Character sync failed", e));
    }
  }, [characters, isLoggedIn, queryClient]);

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        {isLoading ? (
          <Text className="text-white text-center">Chargement...</Text>
        ) : (
          <ScrollView>
            {characters?.map((char: any) => {
              const avatarUri = char.avatar
                ? FileSystem.documentDirectory + char.avatar
                : undefined;
              return (
                <View
                  key={char.id}
                  className="bg-white/10 p-3 rounded-lg mb-3 flex-row items-center"
                >
                  <View className="flex-1 pr-3">
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("CharacterSheet", {
                          characterId: String(char.id),
                        })
                      }
                    >
                      <Text className="text-white text-lg font-semibold">
                        {char.name}
                      </Text>
                    </TouchableOpacity>
                    {debugMode && (
                      <>
                        <Text className="text-yellow-400 text-xs mb-1">
                          id: {char.id} distant_id: {char.distant_id}
                        </Text>
                        <Text className="text-yellow-400 text-xs">
                          characters: {formatSync(char.last_sync_at)}
                        </Text>
                        <Text className="text-yellow-400 text-xs">
                          character_skills: {formatSync(char.skills_last_sync)}
                        </Text>
                        <Text className="text-yellow-400 text-xs">
                          character_capacites: {formatSync(char.capacities_last_sync)}
                        </Text>
                        <Text className="text-yellow-400 text-xs mb-1">
                          desk: {formatSync(char.desk_last_sync)}
                        </Text>
                      </>
                    )}
                    <Text className="text-white text-sm italic mb-2">
                      {char.profession_name || "Profession à définir"}
                    </Text>
                    {char.hobby_name && (
                      <Text className="text-white text-sm italic mb-2">
                        Hobbie : {char.hobby_name}
                      </Text>
                    )}
                    {char.voie_name && (
                      <Text className="text-white text-sm italic mb-2">
                        Voie étrange : {char.voie_name}
                      </Text>
                    )}
                    <View className="flex-row gap-2">
                      {char.distant_id && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onPress={async () => {
                            const id = String(char.distant_id);
                            const url = `https://api.scriptonautes.net/generate-character-pdf.php?id=${id}`;
                            console.log("API URL:", url);
                            console.log("Request payload:", { id });
                            try {
                              const response = await fetch(url);
                              console.log(
                                "API response status:",
                                response.status
                              );
                              const text = await response.text();
                              console.log("API response body:", text);
                              if (response.ok) {
                                Linking.openURL(url);
                              } else {
                                Alert.alert(
                                  "Erreur",
                                  "Impossible de télécharger le PDF"
                                );
                              }
                            } catch (error) {
                              console.log("API error:", error);
                              Alert.alert(
                                "Erreur",
                                "Impossible de générer le PDF"
                              );
                            }
                          }}
                        >
                          <Download color="#fff" size={16} />
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onPress={() =>
                          Alert.alert(
                            "Confirmation",
                            "Voulez-vous supprimer ce personnage ?",
                            [
                              { text: "Non", style: "cancel" },
                              {
                                text: "Oui",
                                onPress: async () => {
                                  if (char.distant_id) {
                                    try {
                                      await apiFetch(
                                        `https://api.scriptonautes.net/api/records/characters/${char.distant_id}`,
                                        { method: "DELETE" },
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Failed to delete remote character",
                                        e,
                                      );
                                    }
                                  }
                                  deleteCharacter.mutate(String(char.id));
                                },
                              },
                            ]
                          )
                        }
                      >
                        Supprimer
                      </Button>
                    </View>
                  </View>
                  {avatarUri && (
                    <Image
                      source={{ uri: avatarUri }}
                      className="w-16 h-16 rounded-full ml-3"
                    />
                  )}
                </View>
              );
            })}
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
