import { useState } from "react";
import { ScrollView, View, TextInput, Modal } from "react-native";
import { Layout, Title, Body, Button, Card, Caption } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import {
  useUpdateBonuses,
  useCharacters,
  useUpdateCharacterSheet,
} from "@/api/charactersLocal";

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
  const [showInfluenceModal, setShowInfluenceModal] = useState(false);
  const [influenceInput, setInfluenceInput] = useState("");
  const [influenceMilieu, setInfluenceMilieu] = useState("");
  const updateBonuses = useUpdateBonuses();
  const { data: characters } = useCharacters();
  const character: any = characters?.find((c: any) => c.id === characterId);
  const updateSheet = useUpdateCharacterSheet();

  const toggle = (id: string) => {
    if (id === "influence") {
      if (selected.includes(id)) {
        setSelected((prev) => prev.filter((b) => b !== id));
        setInfluenceMilieu("");
      } else {
        if (selected.length >= 3) return;
        setInfluenceInput("");
        setShowInfluenceModal(true);
      }
      return;
    }
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
    const proceed = () =>
      updateBonuses.mutate(
        { id: characterId, bonuses: selected },
        {
          onSuccess: () =>
            navigation.navigate("MainTabs", { screen: "Characters" }),
          onError: (err) => alert("❌ Erreur : " + err),
        },
      );

    if (selected.includes("influence")) {
      if (!influenceMilieu.trim()) {
        alert("Précise le milieu pour l'influence sociale");
        return;
      }
      if (!character) {
        alert("❌ Erreur : personnage introuvable");
        return;
      }
      const newRencontres = `${character.rencontres ? character.rencontres + "\n" : ""}Influence sociale augmentée - ${influenceMilieu}`;
      updateSheet.mutate(
        {
          id: characterId,
          origines: character.origines ?? "",
          rencontres: newRencontres,
          notes: character.notes ?? "",
          equipement: character.equipement ?? "",
          fetiches: character.fetiches ?? "",
        },
        {
          onSuccess: proceed,
          onError: (err) => alert("❌ Erreur : " + err),
        },
      );
    } else {
      proceed();
    }
  };

  return (
    <Layout backgroundColor="gradient" className="flex-1 px-4">
      <View className="flex-1">
        <Title className="mb-6 text-center text-white text-3xl font-bold tracking-wide shadow-md">
          Choisis 3 bonus
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
          Tu dois sélectionner exactement trois bonus pour compléter ton histoire.
        </Caption>
      </View>

      <Modal visible={showInfluenceModal} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/60 p-4">
          <View className="bg-gray-900 p-4 rounded-lg">
            <Title className="text-white text-xl mb-2">
              Milieu concerné
            </Title>
            <TextInput
              placeholder="Nom du milieu"
              value={influenceInput}
              onChangeText={setInfluenceInput}
              className="border border-blue-500 rounded-lg p-2 mb-3 text-white"
              placeholderTextColor="#aaa"
            />
            <View className="flex-row justify-between">
              <Button
                variant="secondary"
                onPress={() => setShowInfluenceModal(false)}
                className="flex-1 mr-2 bg-gray-700 border border-gray-500"
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  if (!influenceInput.trim()) {
                    alert("Veuillez saisir un milieu");
                    return;
                  }
                  setInfluenceMilieu(influenceInput.trim());
                  setSelected((prev) => [...prev, "influence"]);
                  setShowInfluenceModal(false);
                }}
                className="flex-1 ml-2 bg-blue-800 border border-blue-500"
              >
                Valider
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

