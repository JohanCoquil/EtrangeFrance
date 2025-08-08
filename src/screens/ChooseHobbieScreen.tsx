import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Layout, Title, Body, Button, Card, Caption } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useUpdateHobby } from "../api/charactersLocal";
import { useHobbies } from "../api/hobbiesLocal";

export default function ChooseHobbieScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { characterId } = route.params;

  const [selectedHobby, setSelectedHobby] = useState<number | null>(null);
  const updateHobby = useUpdateHobby();
  const { data: hobbies, isLoading } = useHobbies();

  const handleConfirm = () => {
    if (!selectedHobby) {
      alert("Choisis un hobbie pour ton enquêteur !");
      return;
    }

    updateHobby.mutate(
      { id: characterId, hobbyId: selectedHobby, hobbyScore: 2 },
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
          Choisis ton Hobbie
        </Title>

        {isLoading ? (
          <Body className="text-center text-white">Chargement...</Body>
        ) : (
          <ScrollView className="flex-1 mb-4" contentContainerStyle={{ paddingBottom: 16 }}>
            {hobbies?.map((hob: any) => (
              <Card
                key={hob.id}
                className={`mb-4 p-5 rounded-xl ${
                  selectedHobby === hob.id
                    ? "bg-blue-900 border-2 border-blue-400"
                    : "bg-black/60 border border-gray-600"
                }`}
              >
                <Title className="text-blue-200 text-xl mb-2">{hob.name}</Title>
                {hob.description && (
                  <Body className="text-gray-300 mb-2">{hob.description}</Body>
                )}
                <Button
                  variant="secondary"
                  onPress={() => setSelectedHobby(hob.id)}
                  className="bg-gray-800 border border-blue-400"
                >
                  {selectedHobby === hob.id ? "✅ Sélectionné" : "Choisir"}
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
            🎯 Valider le Hobbie
          </Title>
        </Button>

        <Caption className="text-center mt-2 text-gray-400 italic">
          Même les enquêteurs ont besoin d'un passe-temps.
        </Caption>
      </View>
    </Layout>
  );
}
