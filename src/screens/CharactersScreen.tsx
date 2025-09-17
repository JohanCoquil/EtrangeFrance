import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, Image } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types"; // ton fichier types.ts
import { useCharacters, useDeleteCharacter } from "@/api/charactersLocal";
import { syncCharacters, importRemoteCharacters } from "@/data/characterSync";
import { apiFetch } from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { Download, RefreshCcw } from "lucide-react-native";

const REMOTE_CHARACTERS_URL =
  "https://api.scriptonautes.net/api/records/characters";

function parseTimestamp(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 0;
    }

    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    const normalised = trimmed.replace(" ", "T");
    const parsedNormalised = Date.parse(normalised);
    if (!Number.isNaN(parsedNormalised)) {
      return parsedNormalised;
    }
  }

  return 0;
}

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
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);
  const charactersRef = useRef<any[]>([]);
  const queryClient = useQueryClient();
  const formatSync = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "Jamais";

  useEffect(() => {
    charactersRef.current = Array.isArray(characters) ? characters : [];
  }, [characters]);

  const handleSync = useCallback(async () => {
    if (!isLoggedIn || syncInProgress.current) {
      return;
    }

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const storedUser = await SecureStore.getItemAsync("user");
      if (!storedUser) {
        console.warn("No stored user found, skipping character sync");
        return;
      }

      let userId: string | number | undefined;
      try {
        const parsed = JSON.parse(storedUser);
        userId = parsed?.id;
      } catch (error) {
        console.error("Failed to parse stored user", error);
        return;
      }

      if (!userId) {
        console.warn("No user ID available, skipping character sync");
        return;
      }

      const localLatest = charactersRef.current.reduce(
        (latest: number, character: any) => {
          const timestamp = parseTimestamp(character?.last_sync_at);
          return timestamp > latest ? timestamp : latest;
        },
        0,
      );

      let remoteLatest = 0;
      let remoteFetchSucceeded = false;

      try {
        const remoteUrl = `${REMOTE_CHARACTERS_URL}?filter=user_id,eq,${encodeURIComponent(
          String(userId),
        )}`;
        const response = await apiFetch(remoteUrl);

        if (response.ok) {
          const data = await response.json();
          const remoteRecords: any[] = Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data)
            ? data
            : [];
          remoteLatest = remoteRecords.reduce((latest: number, record: any) => {
            const timestamp = parseTimestamp(record?.last_sync_at);
            return timestamp > latest ? timestamp : latest;
          }, 0);
          remoteFetchSucceeded = true;
        } else {
          const errorText = await response.text();
          console.error(
            `Failed to fetch remote last_sync_at (${response.status} ${response.statusText})`,
            errorText,
          );
        }
      } catch (error) {
        console.error("Failed to retrieve remote last_sync_at", error);
      }

      const localLastSyncDisplay =
        localLatest > 0 ? new Date(localLatest).toISOString() : "never";
      const remoteLastSyncDisplay =
        remoteLatest > 0 ? new Date(remoteLatest).toISOString() : "never";
      console.log(
        `Sync comparison - local: ${localLastSyncDisplay}, remote: ${remoteLastSyncDisplay}`,
      );

      const shouldImportRemote = remoteFetchSucceeded && remoteLatest > localLatest;

      if (shouldImportRemote) {
        console.log("Remote data is newer; starting remote to local sync");
        await importRemoteCharacters();
      } else {
        console.log(
          "Local data is up to date or remote data is not newer; starting local to remote sync",
        );
        await syncCharacters();
      }

      await queryClient.invalidateQueries({ queryKey: ["characters"] });
    } catch (error) {
      console.error("Character sync failed", error);
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [isLoggedIn, queryClient]);

  const triggerSync = useCallback(() => {
    void handleSync();
  }, [handleSync]);

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

  useFocusEffect(
    useCallback(() => {
      triggerSync();
    }, [triggerSync]),
  );

  useEffect(() => {
    const hasUnsynced = characters?.some((c: any) => {
      const needsInitialSync = c.distant_id === 0 && c.bonuses;
      const needsAvatarSync =
        c.distant_id !== 0 && c.avatar && (!c.avatar_distant || c.avatar_distant === "");
      return needsInitialSync || needsAvatarSync;
    });
    if (hasUnsynced) {
      triggerSync();
    }
  }, [characters, triggerSync]);

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        {debugMode && (
          <View className="flex-row justify-end mb-4">
            <Button
              variant="secondary"
              size="sm"
              onPress={triggerSync}
              disabled={!isLoggedIn || isSyncing}
            >
              <RefreshCcw color="#fff" size={16} />
            </Button>
          </View>
        )}
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
                              const response = await apiFetch(url);
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
                                  if (char.distant_id && isLoggedIn) {
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
