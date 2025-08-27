import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Layout, Title, Body, Button, Card, Caption } from "../components/ui";
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
            navigation.navigate("ChooseBonus", { characterId }),
          onError: (err) => alert("❌ Erreur : " + err),
        }
      );
  };

  return (
    <Layout backgroundColor="gradient" className="flex-1 px-4">
      <View className="flex-1">
        <Title className="mb-6 text-center text-white text-3xl font-bold tracking-wide shadow-md">
          Choisis ta divinité
        </Title>
        {isLoading ? (
          <Body className="text-center text-white">Chargement...</Body>
        ) : (
          <ScrollView className="flex-1 mb-4" contentContainerStyle={{ paddingBottom: 16 }}>
            {divinities?.map((d) => (
              <Card
                key={d.id}
                className={`mb-4 p-5 rounded-xl ${
                  selected === d.id
                    ? "bg-blue-900 border-2 border-blue-400"
                    : "bg-black/60 border border-gray-600"
                }`}
              >
                <Title className="text-blue-200 text-xl mb-2">{d.name}</Title>
                {d.domaine ? (
                  <Body className="text-gray-300 mb-2">Domaine : {d.domaine}</Body>
                ) : null}
                {d.description ? (
                  <Body className="text-gray-400 mb-3">{d.description}</Body>
                ) : null}
                <Button
                  variant="secondary"
                  onPress={() => setSelected(d.id)}
                  className="bg-gray-800 border border-blue-400"
                >
                  {selected === d.id ? "✅ Sélectionnée" : "Choisir"}
                </Button>
              </Card>
            ))}
          </ScrollView>
        )}
      </View>
      <View className="pb-4">
        <Button
          variant="primary"
          onPress={handleConfirm}
          className="mb-2 py-4 bg-blue-800 border-2 border-blue-500 rounded-lg shadow-xl"
        >
          <Title className="text-white text-lg font-bold tracking-wide">
            🙏 Valider la Divinité
          </Title>
        </Button>
        <Caption className="text-center mt-2 text-gray-400 italic">
          Choisis la divinité qui guide ton druide.
        </Caption>
      </View>
    </Layout>
  );
}
