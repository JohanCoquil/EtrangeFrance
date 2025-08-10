import { useState } from "react";
import { View, ImageBackground, Dimensions, FlatList } from "react-native";
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = Dimensions.get("window");
  const itemWidth = width - 32; // padding horizontal in Layout
  const updateStrangePath = useUpdateStrangePath();
  const { data: strangePaths = [], isLoading } = useStrangePaths();

  const handleConfirm = () => {
    const selected = strangePaths[currentIndex];
    if (!selected) {
      alert("Choisis une voie étrange pour ton enquêteur !");
      return;
    }
    updateStrangePath.mutate(
      { id: characterId, voieId: selected.id, voieScore: 2 },
      {
        onSuccess: () => {
          //alert(`✅ Voie étrange sélectionnée : ${selected.name}`);
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
      <Layout backgroundColor="gradient" className="flex-1 px-4">
        <Body className="text-white">Chargement...</Body>
      </Layout>
    );
  }

  return (
    <Layout backgroundColor="gradient" className="flex-1 px-4">
      <Title className="mb-6 text-center text-white text-3xl font-bold tracking-wide shadow-md">
        Choisis ta Voie étrange
      </Title>

      <FlatList<StrangePath>
        data={strangePaths}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) =>
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / itemWidth))
        }
        renderItem={({ item }) => (
          <ImageBackground
            source={
              item.image_url
                ? { uri: item.image_url }
                : require("../../assets/illustrations/background.jpg")
            }
            style={{ width: itemWidth, height: 300, marginRight: 16 }}
            className="rounded-xl overflow-hidden justify-end"
          >
            <View className="bg-black/60 p-4">
              <Title className="text-white text-2xl mb-2">{item.name}</Title>
              <Body className="text-gray-200">{item.description}</Body>
            </View>
          </ImageBackground>
        )}
      />

      <View className="pb-4 mt-4">
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

