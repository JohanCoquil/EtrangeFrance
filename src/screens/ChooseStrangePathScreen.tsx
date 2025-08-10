// ChooseStrangePathScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  Dimensions,
  ScrollView,
  Animated,
  PanResponder,
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
  const { data: strangePaths = [], isLoading } = useStrangePaths();
  const updateStrangePath = useUpdateStrangePath();

  // Données stables triées (une seule ref tant que strangePaths ne change pas)
  const paths = useMemo<StrangePath[]>(
    () => [...strangePaths].sort((a, b) => a.name.localeCompare(b.name)),
    [strangePaths]
  );

  const [index, setIndex] = useState(0);

  // --- Animations (RN Animated, pas Reanimated) ---
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (nextIndex: number, dir: "left" | "right") => {
    // sortie
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: dir === "left" ? -30 : 30,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // changement de contenu
      setIndex(nextIndex);
      // reset opposite
      translateX.setValue(dir === "left" ? 30 : -30);
      opacity.setValue(0);
      // entrée
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // --- Swipe horizontal fiable (le parent prend la main) ---
  const [isPanning, setIsPanning] = useState(false);
  const SWIPE_DIST = 80; // px : distance minimale pour valider un swipe

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        const toLeft = g.dx < -SWIPE_DIST || g.vx < -SWIPE_VEL / 1000;
        const toRight = g.dx > SWIPE_DIST || g.vx > SWIPE_VEL / 1000;
        if (toLeft && index < paths.length - 1) animateTo(index + 1, "left");
        else if (toRight && index > 0) animateTo(index - 1, "right");
      },
      onPanResponderTerminate: () => setIsPanning(false),
    })
  ).current;

  const handleConfirm = () => {
    const selected = paths[index];
    if (!selected) {
      alert("Choisis une voie étrange pour ton enquêteur !");
      return;
    }
    updateStrangePath.mutate(
      { id: characterId, voieId: selected.id, voieScore: 2 },
      {
        onSuccess: () =>
          navigation.navigate("ChooseVoieCapacities", {
            characterId,
            voieId: selected.id,
          }),
        onError: (err) => alert("❌ Erreur lors de l'enregistrement : " + err),
      }
    );
  };

  if (isLoading || paths.length === 0) {
    return (
      <Layout backgroundColor="gradient" className="flex-1">
        <Body className="px-4 text-white">Chargement…</Body>
      </Layout>
    );
  }

  const item = paths[index];

  // NOTE images :
  // - Si tes images sont LOCALES, remplace { uri: item.image_url } par un mapping statique require(...)
  //   (RN n'accepte pas require() dynamique).
  // - Si item.image_url est déjà une URL http(s), laisse tel quel.

  return (
    <Layout backgroundColor="gradient" className="flex-1">
      <Title className="mb-2 px-4 text-center text-white text-3xl font-bold tracking-wide">
        Choisis ta Voie étrange
      </Title>
      <Body className="px-4 text-center text-white opacity-70 mb-4">
        {index + 1} / {paths.length} — swipe ⟷
      </Body>

      <Animated.View
        style={{
          flex: 1,
          width,
          transform: [{ translateX }],
          opacity,
        }}
        {...panResponder.panHandlers}
      >
        <View className="flex-1 px-4">
          {/* Image */}
          <View style={{ borderRadius: 12, overflow: "hidden" }}>
            <ImageBackground
              source={
                item.image_url
                  ? { uri: item.image_url }
                  : require("../../assets/illustrations/background.jpg")
              }
              style={{ width: "100%", height: 220 }}
              imageStyle={{ borderRadius: 12 }}
              fadeDuration={0}
            />
          </View>

          {/* Titre item */}
          <Title className="text-white text-2xl my-4 text-center">
            {item.name}
          </Title>

          {/* Description : scroll vertical, fond noir.
              On bloque le scroll pendant le swipe pour que le parent garde la main. */}
          <View style={{ flex: 1, minHeight: 140 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              scrollEnabled={!isPanning} // ← clé : le ScrollView ne “vole” pas le geste
            >
              <View className="p-4 bg-black rounded-lg">
                <Body className="text-gray-200">
                  {item.description ?? "—"}
                </Body>
              </View>
            </ScrollView>
          </View>
        </View>
      </Animated.View>

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
