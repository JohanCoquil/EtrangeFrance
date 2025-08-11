import { useState } from "react";
import { ScrollView, View, Modal, TextInput } from "react-native";
import { Layout, Title, Body, Button, Card, Caption } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useUpdateProfession } from "../api/charactersLocal";
import { useProfessions, useAddProfession } from "../api/professionsLocal";

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
  const addProfession = useAddProfession();
  const [isModalVisible, setModalVisible] = useState(false);
  const [newProfessionName, setNewProfessionName] = useState("");
  const [skillInputs, setSkillInputs] = useState<string[]>(["", "", ""]);

  const handleConfirm = () => {
    if (!selectedProfession) {
      alert("Choisis un métier pour ton enquêteur !");
      return;
    }

    updateProfession.mutate(
      { id: characterId, professionId: selectedProfession, professionScore: 3 },
      {
        onSuccess: () => {
          navigation.navigate("ChooseHobbie", { characterId });
        },
        onError: (err) => {
          alert("❌ Erreur lors de l'enregistrement : " + err);
        },
      }
    );
  };

  const addSkillField = () => {
    if (skillInputs.length < 5) {
      setSkillInputs([...skillInputs, ""]);
    }
  };

  const updateSkill = (index: number, value: string) => {
    const updated = [...skillInputs];
    updated[index] = value;
    setSkillInputs(updated);
  };

  const handleCreateProfession = () => {
    const name = newProfessionName.trim();
    const skills = skillInputs.map((s) => s.trim()).filter((s) => s);
    if (!name || skills.length < 3) {
      alert("Nom et au moins 3 compétences requis");
      return;
    }

    addProfession.mutate(
      { name, skills },
      {
        onSuccess: (professionId) => {
          setModalVisible(false);
          setNewProfessionName("");
          setSkillInputs(["", "", ""]);
          updateProfession.mutate(
            { id: characterId, professionId, professionScore: 3 },
            {
              onSuccess: () => {
                navigation.navigate("ChooseHobbie", { characterId });
              },
              onError: (err) => {
                alert("❌ Erreur lors de l'enregistrement : " + err);
              },
            }
          );
        },
        onError: (err) => {
          alert("❌ Erreur lors de l'ajout : " + err);
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
            <Card className="mb-4 p-5 rounded-xl bg-black/60 border border-gray-600">
              <Title className="text-blue-200 text-xl mb-2">
                Autre métier
              </Title>
              <Button
                variant="secondary"
                onPress={() => setModalVisible(true)}
                className="bg-gray-800 border border-blue-400"
              >
                Ajouter
              </Button>
            </Card>
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
            🚀 Valider le Métier
          </Title>
        </Button>

        <Caption className="text-center mt-2 text-gray-400 italic">
          Avant de devenir enquêteur, vous aviez une vie, des amis... Une profession.
        </Caption>
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/60 p-4">
          <View className="bg-gray-900 p-4 rounded-lg">
            <Title className="text-white text-xl mb-2">Nouveau Métier</Title>
            <TextInput
              placeholder="Nom du métier"
              value={newProfessionName}
              onChangeText={setNewProfessionName}
              className="border border-blue-500 rounded-lg p-2 mb-3 text-white"
              placeholderTextColor="#aaa"
            />
            {skillInputs.map((skill, idx) => (
              <TextInput
                key={idx}
                placeholder={`Compétence ${idx + 1}`}
                value={skill}
                onChangeText={(text) => updateSkill(idx, text)}
                className="border border-blue-500 rounded-lg p-2 mb-3 text-white"
                placeholderTextColor="#aaa"
              />
            ))}
            {skillInputs.length < 5 && (
              <Button
                variant="secondary"
                onPress={addSkillField}
                className="mb-3 bg-gray-800 border border-blue-400"
              >
                Ajouter une compétence
              </Button>
            )}
            <View className="flex-row justify-between">
              <Button
                variant="secondary"
                onPress={() => setModalVisible(false)}
                className="flex-1 mr-2 bg-gray-700 border border-gray-500"
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                onPress={handleCreateProfession}
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
