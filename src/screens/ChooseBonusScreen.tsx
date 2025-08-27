import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Layout, Title, Body, Button, Card, Caption } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useUpdateBonuses } from "@/api/charactersLocal";

const bonusOptions = [
  {
    id: "influence",
    title: "Influence Sociale Augmentée",
    description:
      "Choisis un milieu d'influence où tu te fais aisément des relations.",
  },
  {
    id: "objet",
    title: "Objet Spécial lié à l’Histoire",
    description:
      "Un objet fétiche permettant d'ajouter une carte JOKER lors des tirages le concernant.",
  },
  {
    id: "competence",
    title: "+1 à une Compétence ou Spécialisation",
    description:
      "Développe une nouvelle compétence ou spécialisation avec un bonus de +1.",
  },
  {
    id: "richesse",
    title: "Richesse Augmentée",
    description:
      "Gagne un niveau de richesse et change de classe sociale selon ton métier.",
  },
  {
    id: "specialite",
    title: "Nouvelle Spécialité Étrange",
    description:
      "Ajoute une spécialité étrange supplémentaire à ta voie choisie.",
  },
  {
    id: "effet",
    title: "Effet Déclenché",
    description:
      "Définit un effet spécial pour une compétence de niveau 2 ou plus lorsqu'une carte particulière est tirée.",
  },
];

export default function ChooseBonusScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { characterId } = route.params;
  const [selected, setSelected] = useState<string[]>([]);
  const updateBonuses = useUpdateBonuses();

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((b) => b !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (selected.length !== 3) {
      alert("Choisis exactement 3 bonus");
      return;
    }
    updateBonuses.mutate(
      { id: characterId, bonuses: selected },
      {
        onSuccess: () =>
          navigation.navigate("MainTabs", { screen: "Characters" }),
        onError: (err) => alert("❌ Erreur : " + err),
      }
    );
  };

  return (
    <Layout backgroundColor="gradient" className="flex-1 px-4">
      <View className="flex-1">
        <Title className="mb-6 text-center text-white text-3xl font-bold tracking-wide shadow-md">
          Choisis tes bonus
        </Title>
        <ScrollView className="flex-1 mb-4" contentContainerStyle={{ paddingBottom: 16 }}>
          {bonusOptions.map((b) => (
            <Card
              key={b.id}
              className={`mb-4 p-5 rounded-xl ${
                selected.includes(b.id)
                  ? "bg-blue-900 border-2 border-blue-400"
                  : "bg-black/60 border border-gray-600"
              }`}
            >
              <Title className="text-blue-200 text-xl mb-2">{b.title}</Title>
              <Body className="text-gray-300 mb-3">{b.description}</Body>
              <Button
                variant="secondary"
                onPress={() => toggle(b.id)}
                className="bg-gray-800 border border-blue-400"
              >
                {selected.includes(b.id) ? "✅ Sélectionné" : "Choisir"}
              </Button>
            </Card>
          ))}
        </ScrollView>
      </View>
      <View className="pb-4">
        <Button
          variant="primary"
          onPress={handleConfirm}
          className="mb-2 py-4 bg-blue-800 border-2 border-blue-500 rounded-lg shadow-xl"
        >
          <Title className="text-white text-lg font-bold tracking-wide">
            🎁 Valider les Bonus
          </Title>
        </Button>
        <Caption className="text-center mt-2 text-gray-400 italic">
          Sélectionne trois bonus pour compléter ton histoire.
        </Caption>
      </View>
    </Layout>
  );
}

