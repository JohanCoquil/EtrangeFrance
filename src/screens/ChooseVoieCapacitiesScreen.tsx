import React, { useState } from "react";
import { View } from "react-native";
import { Layout, Title, Body, Button } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useCapacitesByVoie, useUpdateCharacterCapacites } from "@/api/capacitiesLocal";

export default function ChooseVoieCapacitiesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { characterId, voieId } = route.params;

  const { data: capacites, isLoading } = useCapacitesByVoie(voieId);
  const [levels, setLevels] = useState<Record<number, number>>({});
  const updateCapacites = useUpdateCharacterCapacites();

  const totalPoints = Object.values(levels).reduce((a, b) => a + b, 0);

  const increment = (id: number) => {
    if (totalPoints >= 2) return;
    setLevels((prev) => ({ ...prev, [id]: Math.min(2, (prev[id] || 0) + 1) }));
  };

  const decrement = (id: number) => {
    setLevels((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleConfirm = () => {
    if (totalPoints !== 2) {
      alert("Distribue tes 2 points de capacités");
      return;
    }
    const data = Object.entries(levels).map(([id, level]) => ({
      capaciteId: Number(id),
      level,
    }));
    updateCapacites.mutate(
      { characterId, capacites: data },
      {
        onSuccess: () => {
          //alert("✅ Capacités enregistrées");
          navigation.navigate("MainTabs", { screen: "Characters" });
        },
        onError: (err) => alert("❌ Erreur : " + err),
      }
    );
  };

  if (isLoading) {
    return (
      <Layout backgroundColor="gradient" className="px-4 py-6">
        <Body className="text-white">Chargement...</Body>
      </Layout>
    );
  }

  return (
    <Layout backgroundColor="gradient" className="px-4 py-6">
      <Title className="text-center text-white text-2xl mb-4">
        Choisis tes capacités
      </Title>
      {capacites?.map((cap: any) => (
        <View
          key={cap.id}
          className="flex-row justify-between items-center mb-3"
        >
          <View className="flex-1 pr-2">
            <Title className="text-white text-lg">{cap.name}</Title>
            <Body className="text-gray-300 text-sm">{cap.description}</Body>
          </View>
          <View className="flex-row items-center">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => decrement(cap.id)}
              className="px-2"
            >
              -
            </Button>
            <Body className="text-white mx-2">
              {levels[cap.id] || 0}
            </Body>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => increment(cap.id)}
              className="px-2"
            >
              +
            </Button>
          </View>
        </View>
      ))}
      <Body className="text-white mb-4">
        Points restants : {2 - totalPoints}
      </Body>
      <Button variant="primary" onPress={handleConfirm} className="mt-2">
        Valider
      </Button>
    </Layout>
  );
}
