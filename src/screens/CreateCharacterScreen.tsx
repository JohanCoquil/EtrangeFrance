import { useState } from "react";
import { TextInput, View, ScrollView, Dimensions } from "react-native";
import { Layout, Title, Body, Button, Caption } from "../components/ui";
import { useAddCharacter } from "../api/charactersLocal";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { LinearGradient } from "expo-linear-gradient";

type CharacterStats = {
  intelligence: number;
  force: number;
  dexterite: number;
  charisme: number;
  memoire: number;
  volonte: number;
};

const MAX_POINTS = 17;
const MIN_VALUE = 1;
const MAX_VALUE = 5;

export default function CreateCharacterScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const addCharacter = useAddCharacter();

  const [name, setName] = useState("");
  const [stats, setStats] = useState<CharacterStats>({
    intelligence: 1,
    force: 1,
    dexterite: 1,
    charisme: 1,
    memoire: 1,
    volonte: 1,
  });

  const totalPoints = Object.values(stats).reduce((a, b) => a + b, 0);
  const remainingPoints = MAX_POINTS - totalPoints;

  const updateStat = (key: keyof CharacterStats, delta: number) => {
    setStats((prev) => {
      const newValue = prev[key] + delta;
      if (
        newValue < MIN_VALUE ||
        newValue > MAX_VALUE ||
        totalPoints + delta > MAX_POINTS
      ) {
        return prev;
      }
      return { ...prev, [key]: newValue };
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      alert("Nom obligatoire !");
      return;
    }
    if (totalPoints !== MAX_POINTS) {
      alert(`Il faut utiliser exactement ${MAX_POINTS} points.`);
      return;
    }

    // On fait une première sauvegarde en BDD
    addCharacter.mutate(
      {
        name,
        profession_id: null,
        ...stats,
        creation_step: 1, // marque l’avancement
      },
      {
        onSuccess: (newCharacter) => {
          // Redirection vers l'étape 2 avec l'objet sauvegardé
          navigation.navigate("ChooseProfession", { characterId: newCharacter.id });
        },
        onError: (error) => {
          alert("❌ Erreur ajout personnage :" + error);
        },
      }
    );
  };


  const StatRow = ({
    label,
    desc,
    value,
    onIncrement,
    onDecrement,
  }: {
    label: string;
    desc: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
  }) => (
    <View className="mb-4 p-4 bg-black/70 rounded-lg border border-blue-400 shadow-md">
      <Title className="text-lg text-white font-bold tracking-wide drop-shadow">
        {label}
      </Title>
      <Caption className="text-blue-200 mb-2 italic">{desc}</Caption>
      <View className="flex-row items-center justify-between mt-2">
        <Button
          variant="secondary"
          className="border border-gray-500 bg-gray-800"
          onPress={onDecrement}
        >
          <Body className="text-white font-bold text-lg">-</Body>
        </Button>
        <Body
          className={`${remainingPoints === 0 ? "text-green-300" : "text-white"
            } text-2xl font-bold`}
        >
          {value}
        </Body>
        <Button
          variant="secondary"
          className="border border-gray-500 bg-gray-800"
          onPress={onIncrement}
        >
          <Body className="text-white font-bold text-lg">+</Body>
        </Button>
      </View>
    </View>
  );



  const { height } = Dimensions.get("window");

  return (
    <LinearGradient
      colors={["#0f2027", "#203a43", "#2c5364"]}
      style={{ flex: 1, minHeight: height }}
    >
      <Layout variant="scroll" backgroundColor="gradient" className="px-4">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Titre */}
          <Title className="mb-4 text-center text-white text-3xl font-bold tracking-wide shadow-md">
            Création de Personnage
          </Title>

          {/* Champ Nom */}
          <TextInput
            placeholder="Nom du personnage"
            value={name}
            onChangeText={setName}
            className="border border-blue-500 rounded-lg p-3 mb-6 text-white bg-black/40 shadow-md"
            placeholderTextColor="#aaa"
          />

          {/* Instructions */}
          <Body className="text-center text-gray-200 mb-3">
            Répartis{" "}
            <Body className="text-blue-300 font-bold">{MAX_POINTS}</Body> points
            entre tes caractéristiques.
          </Body>
          <Caption
            className={`text-center mb-6 ${remainingPoints === 0 ? "text-green-400" : "text-gray-400"
              }`}
          >
            Points restants : {remainingPoints}
          </Caption>

          {/* Caractéristiques */}
          <StatRow
            label="Intelligence"
            desc="Analyser et s’adapter"
            value={stats.intelligence}
            onIncrement={() => updateStat("intelligence", 1)}
            onDecrement={() => updateStat("intelligence", -1)}
          />
          <StatRow
            label="Force"
            desc="Puissance physique du personnage"
            value={stats.force}
            onIncrement={() => updateStat("force", 1)}
            onDecrement={() => updateStat("force", -1)}
          />
          <StatRow
            label="Dextérité"
            desc="Agilité et précision"
            value={stats.dexterite}
            onIncrement={() => updateStat("dexterite", 1)}
            onDecrement={() => updateStat("dexterite", -1)}
          />
          <StatRow
            label="Charisme"
            desc="Séduire et convaincre"
            value={stats.charisme}
            onIncrement={() => updateStat("charisme", 1)}
            onDecrement={() => updateStat("charisme", -1)}
          />
          <StatRow
            label="Mémoire"
            desc="Instinct, perception et recherches"
            value={stats.memoire}
            onIncrement={() => updateStat("memoire", 1)}
            onDecrement={() => updateStat("memoire", -1)}
          />
          <StatRow
            label="Volonté"
            desc="Force mentale du personnage"
            value={stats.volonte}
            onIncrement={() => updateStat("volonte", 1)}
            onDecrement={() => updateStat("volonte", -1)}
          />

          {/* Bouton Valider */}
          <Button
            variant="primary"
            onPress={handleCreate}
            disabled={remainingPoints !== 0 || addCharacter.isPending}
            className="mt-6 py-4 bg-blue-800 border-2 border-blue-500 rounded-lg shadow-xl"
          >
            <Title className="text-white text-lg font-bold tracking-wide">
              ✨ Valider le Personnage
            </Title>
          </Button>

          {/* Footer */}
          <Caption className="text-center mt-6 text-gray-400 italic">
            Un nouvel enquêteur de l'étrange s'apprête à passer les portes de l'Agence...
          </Caption>
        </ScrollView>
      </Layout>
    </LinearGradient>
  );
}
