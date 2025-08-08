import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Layout, Title, Body, Button, Card } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useUpdateProfession } from "../api/charactersLocal";
import { useProfessions } from "../api/professionsLocal";

export default function ChooseProfessionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { characterId } = route.params;

  const [selectedProfession, setSelectedProfession] = useState<number | null>(
    null
  );
  const updateProfession = useUpdateProfession();
  const { data: professions, isLoading } = useProfessions();

  const handleConfirm = () => {
    if (!selectedProfession) {
      alert("Choisis un métier pour ton enquêteur !");
      return;
    }

    updateProfession.mutate(
      { id: characterId, professionId: selectedProfession },
      {
        onSuccess: () => {
          alert("✅ Personnage finalisé !");
          navigation.navigate("MainTabs", { screen: "Characters" });
        },
        onError: (err) => {
          alert("❌ Erreur lors de l'enregistrement : " + err);
        },
      }
    );
  };

  return (
    <Layout backgroundColor="gradient" className="flex-1 px-4">
      <View className="flex-1">
        <Title className="mb-6 text-center text-white text-3xl font-bold tracking-wide shadow-md">
          Choisis ton Métier
        </Title>

        {isLoading ? (
          <Body className="text-center text-white">Chargement...</Body>
        ) : (
          <ScrollView className="flex-1 mb-4" contentContainerStyle={{ paddingBottom: 16 }}>
            {professions?.map((prof: any) => (
              <Card
                key={prof.id}
                className={`mb-4 p-5 rounded-xl ${
                  selectedProfession === prof.id
                    ? "bg-blue-900 border-2 border-blue-400"
                    : "bg-black/60 border border-gray-600"
                }`}
              >
                <Title className="text-blue-200 text-xl mb-2">{prof.name}</Title>
                {prof.description && (
                  <Body className="text-gray-300 mb-2">{prof.description}</Body>
                )}
                {prof.skills.length > 0 && (
                  <Body className="text-gray-400 mb-3">
                    Compétences : {prof.skills.join(", ")}
                  </Body>
                )}
                <Button
                  variant="secondary"
                  onPress={() => setSelectedProfession(prof.id)}
                  className="bg-gray-800 border border-blue-400"
                >
                  {selectedProfession === prof.id ? "✅ Sélectionné" : "Choisir"}
                </Button>
              </Card>
            ))}
          </ScrollView>
        )}

        <Button
          variant="primary"
          onPress={handleConfirm}
          className="mb-4 py-4 bg-blue-800 border-2 border-blue-500 rounded-lg shadow-xl"
        >
          <Title className="text-white text-lg font-bold tracking-wide">
            🚀 Valider le Métier
          </Title>
        </Button>
      </View>
    </Layout>
  );
}
