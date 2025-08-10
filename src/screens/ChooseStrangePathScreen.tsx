import { useState, useRef, useEffect } from "react";
import {
  View,
  ImageBackground,
  Dimensions,
  FlatList,
  ScrollView,
} from "react-native";
import { Layout, Title, Body, Button } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useUpdateStrangePath } from "../api/charactersLocal";
import { useStrangePaths, StrangePath } from "@/api/strangePathsLocal";

export default function ChooseStrangePathScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { characterId } = route.params;

  const { width } = Dimensions.get("window");
  const updateStrangePath = useUpdateStrangePath();
  const { data: strangePaths = [], isLoading } = useStrangePaths();

  const [currentIndex, setCurrentIndex] = useState(0);
  const pathsRef = useRef<StrangePath[]>([]);

  // Charger et figer les données au montage
  useEffect(() => {
    if (pathsRef.current.length === 0 && strangePaths.length > 0) {
      pathsRef.current = [...strangePaths].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  }, [strangePaths]);

  const handleConfirm = () => {
    const selected = pathsRef.current[currentIndex];
    if (!selected) {
      alert("Choisis une voie étrange pour ton enquêteur !");
      return;
    }
    updateStrangePath.mutate(
      { id: characterId, voieId: selected.id, voieScore: 2 },
      {
        onSuccess: () => {
          navigation.navigate("ChooseVoieCapacities", {
            characterId,
            voieId: selected.id,
          });
        },
        onError: (err) => {
          alert("❌ Erreur lors de l'enregistrement : " + err);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout backgroundColor="gradient" className="flex-1">
        <Body className="px-4 text-white">Chargement...</Body>
      </Layout>
    );
  }

  return (
    <Layout backgroundColor="gradient" className="flex-1">
      <Title className="mb-6 px-4 text-center text-white text-3xl font-bold tracking-wide shadow-md">
        Choisis ta Voie étrange
      </Title>

      <FlatList
        data={pathsRef.current}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) =>
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        className="flex-1"
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 px-4">
            {/* Image avec arrondi */}
            <View style={{ borderRadius: 12, overflow: "hidden" }}>
              <ImageBackground
                source={
                  item.image_url
                    ? { uri: item.image_url }
                    : require("../../assets/illustrations/background.jpg")
                }
                style={{ width: "100%", height: 200 }}
                imageStyle={{ borderRadius: 12 }}
                fadeDuration={0}
              />
            </View>

            {/* Nom */}
            <Title className="text-white text-2xl my-4 text-center">
              {item.name}
            </Title>

            {/* Description scrollable avec fond noir */}
            <ScrollView
              className="flex-1"
              nestedScrollEnabled
              showsVerticalScrollIndicator={true}
            >
              <View className="p-4 bg-black rounded-lg">
                <Body className="text-gray-200">{item.description}</Body>
              </View>
            </ScrollView>
          </View>
        )}
      />

      {/* Bouton validation */}
      <View className="pb-4 mt-4 px-4">
        <Button
          variant="primary"
          onPress={handleConfirm}
          className="mb-2 py-4 bg-blue-800 border-2 border-blue-500 rounded-lg shadow-xl"
        >
          <Title className="text-white text-lg font-bold tracking-wide">
            🎯 Valider la Voie étrange
          </Title>
        </Button>
      </View>
    </Layout>
  );
}
