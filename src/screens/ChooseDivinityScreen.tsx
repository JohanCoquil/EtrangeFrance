import { useState } from "react";
import { ScrollView } from "react-native";
import { Layout, Title, Body, Button, Card } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useDivinities } from "@/api/divinitiesLocal";
import { useUpdateDivinity } from "@/api/charactersLocal";

export default function ChooseDivinityScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { characterId } = route.params;

  const { data: divinities, isLoading } = useDivinities();
  const updateDivinity = useUpdateDivinity();
  const [selected, setSelected] = useState<number | null>(null);

  const handleConfirm = () => {
    if (!selected) {
      alert("Choisis une divinité");
      return;
    }
    updateDivinity.mutate(
      { id: characterId, divinityId: selected },
      {
        onSuccess: () =>
          navigation.navigate("MainTabs", { screen: "Characters" }),
        onError: (err) => alert("❌ Erreur : " + err),
      }
    );
  };

  return (
    <Layout backgroundColor="gradient" className="flex-1 px-4 py-6">
      {isLoading ? (
        <Body className="text-white">Chargement...</Body>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <Title className="text-center text-white text-2xl mb-4">
            Choisis ta divinité
          </Title>
          {divinities?.map((d) => (
            <Card
              key={d.id}
              className={`mb-4 p-4 ${
                selected === d.id
                  ? "bg-blue-900 border-2 border-blue-400"
                  : "bg-black/60 border border-gray-600"
              }`}
            >
              <Title className="text-blue-200 text-lg mb-1">{d.name}</Title>
              {d.domaine ? (
                <Body className="text-gray-300 mb-1">Domaine : {d.domaine}</Body>
              ) : null}
              {d.description ? (
                <Body className="text-gray-400">{d.description}</Body>
              ) : null}
              <Button
                variant="secondary"
                onPress={() => setSelected(d.id)}
                className="mt-2 bg-gray-800 border border-blue-400"
              >
                {selected === d.id ? "✅ Sélectionnée" : "Choisir"}
              </Button>
            </Card>
          ))}
          <Button variant="primary" onPress={handleConfirm} className="mt-2">
            Valider
          </Button>
        </ScrollView>
      )}
    </Layout>
  );
}
