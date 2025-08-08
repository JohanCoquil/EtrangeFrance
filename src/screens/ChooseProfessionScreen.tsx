import { useState } from "react";
import { ScrollView, Dimensions } from "react-native";
import { Layout, Title, Body, Button, Card } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
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

  const { height } = Dimensions.get("window");

  return (
    <LinearGradient
      colors={["#0f2027", "#203a43", "#2c5364"]}
      style={{ flex: 1, minHeight: height }}
    >
      <Layout variant="scroll" backgroundColor="gradient" className="px-4">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Title className="mb-6 text-center text-white text-3xl font-bold tracking-wide shadow-md">
            Choisis ton Métier
          </Title>

          {isLoading ? (
            <Body className="text-center text-white">Chargement...</Body>
          ) : (
            professions?.map((prof: any) => (
              <Card
                key={prof.id}
                className={`mb-4 p-5 rounded-xl ${selectedProfession === prof.id
                    ? "bg-blue-900 border-2 border-blue-400"
                    : "bg-black/60 border border-gray-600"
                  }`}
              >
                <Title className="text-blue-200 text-xl mb-2">{prof.name}</Title>
                <Body className="text-gray-300 mb-3">{prof.description}</Body>
                <Button
                  variant="secondary"
                  onPress={() => setSelectedProfession(prof.id)}
                  className="bg-gray-800 border border-blue-400"
                >
                  {selectedProfession === prof.id ? "✅ Sélectionné" : "Choisir"}
                </Button>
              </Card>
            ))
          )}

          <Button
            variant="primary"
            onPress={handleConfirm}
            className="mt-8 py-4 bg-blue-800 border-2 border-blue-500 rounded-lg shadow-xl"
          >
            <Title className="text-white text-lg font-bold tracking-wide">
              🚀 Valider le Métier
            </Title>
          </Button>
        </ScrollView>
      </Layout>
    </LinearGradient>
  );
}
