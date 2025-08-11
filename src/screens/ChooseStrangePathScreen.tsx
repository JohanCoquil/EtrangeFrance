// src/screens/ChooseStrangePathScreen.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  ImageBackground,
  Dimensions,
  Animated,
} from "react-native";
import {
  ScrollView,              // RNGH ScrollView
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
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

  // Données triées – une seule ref tant que la requête ne change pas
  const paths: StrangePath[] = useMemo(
    () => [...strangePaths].sort((a, b) => a.name.localeCompare(b.name)),
    [strangePaths]
  );

  const [index, setIndex] = useState(0);

  // ----- Animated (RN) : fade + petit slide -----
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (nextIndex: number, dir: "left" | "right") => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: dir === "left" ? -30 : 30,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIndex(nextIndex);
      translateX.setValue(dir === "left" ? 30 : -30);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ----- Geste Pan (ancienne API) + coexistence avec ScrollView -----
  const scrollRef = useRef<ScrollView>(null);
  const panRef = useRef<PanGestureHandler>(null);
  const [isPanning, setIsPanning] = useState(false);

  const SWIPE_DIST = 70;

  const onGestureEvent = (_e: PanGestureHandlerGestureEvent) => {
    /* si tu veux jouer un son au dépassement d’un seuil, c’est ici */
  };

  const onHandlerStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX } = e.nativeEvent;

    if (state === State.BEGAN) {
      setIsPanning(true);
      return;
    }

    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      setIsPanning(false);

      const toLeft = translationX <= -SWIPE_DIST;
      const toRight = translationX >= SWIPE_DIST;

      if (toLeft && index < paths.length - 1) animateTo(index + 1, "left");
      else if (toRight && index > 0) animateTo(index - 1, "right");
    }
  };

  if (isLoading || paths.length === 0) {
    return (
      <Layout backgroundColor="gradient" className="flex-1">
        <Body className="px-4 text-white">Chargement…</Body>
      </Layout>
    );
  }

  const item = paths[index];

  return (
    <Layout backgroundColor="gradient" className="flex-1">
      <Title className="mb-2 px-4 text-center text-white text-3xl font-bold tracking-wide">
        Choisis ta Voie étrange
      </Title>
      <Body className="px-4 text-center text-white opacity-70 mb-4">
        {index + 1} / {paths.length} — swipe ⟷
      </Body>

      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-20, 20]}   // doit partir franchement en X
        failOffsetY={[-12, 12]}     // si ça part trop en Y → on laisse scroller
        simultaneousHandlers={scrollRef} // ✅ coexiste avec le ScrollView
      >
        <Animated.View
          style={{
            flex: 1,
            width,
            transform: [{ translateX }],
            opacity,
          }}
        >
          <View className="flex-1 px-4">
            {/* Image */}
            <View style={{ borderRadius: 12, overflow: "hidden" }}>
              <ImageBackground
                source={
                  item.image_url
                    ? { uri: item.image_url } // si local, préfère un mapping require(...)
                    : require("../../assets/illustrations/background.jpg")
                }
                style={{ width: "100%", height: 220 }}
                imageStyle={{ borderRadius: 12 }}
              />
            </View>

            {/* Titre item */}
            <Title className="text-white text-2xl my-4 text-center">
              {item.name}
            </Title>

            {/* Description : scroll vertical, fond noir */}
            <View style={{ flex: 1, minHeight: 140 }}>
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 8 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                simultaneousHandlers={panRef}   // ✅ coexiste avec le Pan
                scrollEnabled={!isPanning}       // évite que le ScrollView “vole” le swipe
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
      </PanGestureHandler>

      <View className="pb-4 mt-4 px-4">
        <Button
          variant="primary"
          onPress={() => {
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
          }}
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
