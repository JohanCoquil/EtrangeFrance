import React, { useCallback, useMemo, useState } from "react";
import { Alert, View, Text } from "react-native";
import Layout from "@/components/ui/Layout";
import { RouteProp, useRoute } from "@react-navigation/native";
import { ScenariosStackParamList } from "@/navigation/ScenariosNavigator";
import Button from "@/components/ui/Button";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "@/utils/api";

const sectionContainerClass = "bg-white/10 rounded-xl p-4 mb-6";
const sectionTitleClass = "text-white text-lg font-semibold mb-2";
const sectionContentClass = "text-white text-base leading-6";

type ScenarioDescriptionRouteProp = RouteProp<
  ScenariosStackParamList,
  "ScenarioDescription"
>;

export default function ScenarioDescriptionScreen() {
  const route = useRoute<ScenarioDescriptionRouteProp>();
  const { scenario } = route.params;
  const [creating, setCreating] = useState(false);

  const pitchText = useMemo(() => scenario.pitch?.trim() ?? "", [scenario.pitch]);
  const secretsText = useMemo(
    () => scenario.secrets?.trim() ?? "",
    [scenario.secrets],
  );

  const handleCreateParty = useCallback(async () => {
    if (creating) {
      return;
    }

    const storedUser = await SecureStore.getItemAsync("user");
    if (!storedUser) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour créer une nouvelle partie.",
      );
      return;
    }

    let parsedUser: any = null;
    try {
      parsedUser = JSON.parse(storedUser);
    } catch (error) {
      console.error("Unable to parse stored user", error);
      Alert.alert("Erreur", "Impossible de récupérer vos informations utilisateur.");
      return;
    }

    const userId = Number(parsedUser?.id);
    if (!Number.isFinite(userId)) {
      Alert.alert("Erreur", "Identifiant utilisateur invalide.");
      return;
    }

    const scenarioId = Number(scenario.id);
    if (!Number.isFinite(scenarioId)) {
      Alert.alert(
        "Erreur",
        "Impossible de déterminer le scénario associé à cette partie.",
      );
      return;
    }

    setCreating(true);

    try {
      const res = await apiFetch("https://api.scriptonautes.net/api/records/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mj_id: userId,
          scenario_id: scenarioId,
        }),
      });

      const rawText = await res.text();
      if (!res.ok) {
        throw new Error(rawText || "Impossible de créer une nouvelle partie.");
      }

      let createdId: string | null = null;
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          const possibleIds = [
            parsed?.id,
            parsed?.distant_id,
            parsed?.data?.id,
            parsed?.record?.id,
            parsed?.records?.[0]?.id,
          ];
          for (const value of possibleIds) {
            if (value !== undefined && value !== null) {
              createdId = String(value);
              break;
            }
          }
        } catch {
          const trimmed = rawText.trim();
          if (trimmed.length > 0) {
            createdId = trimmed;
          }
        }
      }

      Alert.alert(
        "Succès",
        createdId
          ? `Une nouvelle partie a été créée (ID ${createdId}).`
          : "Une nouvelle partie a été créée.",
      );
    } catch (error) {
      console.error("Failed to create party", error);
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de créer une nouvelle partie pour le moment.",
      );
    } finally {
      setCreating(false);
    }
  }, [creating, scenario.id]);

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        <Text className="text-white text-2xl font-bold mb-6 text-center">
          {scenario.titre}
        </Text>
        <View className={sectionContainerClass}>
          <Text className={sectionTitleClass}>Pitch</Text>
          <Text className={sectionContentClass}>
            {pitchText.length > 0
              ? pitchText
              : "Aucun pitch disponible pour ce scénario."}
          </Text>
        </View>
        <View className={sectionContainerClass}>
          <Text className={sectionTitleClass}>Secret</Text>
          <Text className={sectionContentClass}>
            {secretsText.length > 0
              ? secretsText
              : "Aucun secret n'a été renseigné pour ce scénario."}
          </Text>
        </View>
        <View className="mt-6">
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateParty}
            disabled={creating}
          >
            {creating ? "Création en cours..." : "Créer une nouvelle partie"}
          </Button>
        </View>
      </View>
    </Layout>
  );
}
