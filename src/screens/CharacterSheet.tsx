import React, { useRef, useEffect, useState } from "react";
import { View, TextInput, Dimensions, ScrollView } from "react-native";
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import GestureRecognizer, {
  GestureRecognizerProps,
} from "react-native-swipe-gestures";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Layout, Title, Body, Caption } from "../components/ui";
import { RootStackParamList } from "../navigation/types";
import { useCharacters } from "@/api/charactersLocal";
import { useCharacterCapacites } from "@/api/capacitiesLocal";
import CardFlip, { CardFlipRef } from "@/components/CardFlip";

export default function CharacterSheet() {
  const route = useRoute<RouteProp<RootStackParamList, "CharacterSheet">>();
  const { characterId } = route.params;
  const { width, height } = Dimensions.get("window");
  const cardRef = useRef<CardFlipRef>(null);
  const flipSound = useRef<AudioPlayer | null>(null);
  const frontScrollRef = useRef<ScrollView>(null);
  const backScrollRef = useRef<ScrollView>(null);
  const [isBack, setIsBack] = useState(false);
  const { data: characters, isLoading } = useCharacters();
  const character: any = characters?.find((c: any) => c.id === characterId);
  const { data: capacites } = useCharacterCapacites(characterId);

  if (isLoading) {
    return (
      <Layout backgroundColor="gradient" className="px-4 py-6">
        <Body className="text-white">Chargement...</Body>
      </Layout>
    );
  }

  if (!character) {
    return (
      <Layout backgroundColor="gradient" className="px-4 py-6">
        <Body className="text-white">Personnage introuvable.</Body>
      </Layout>
    );
  }

  const stats = [
    { label: "Force", value: character.force },
    { label: "Dextérité", value: character.dexterite },
    { label: "Intelligence", value: character.intelligence },
    { label: "Charisme", value: character.charisme },
    { label: "Mémoire", value: character.memoire },
    { label: "Volonté", value: character.volonte },
    { label: "Santé", value: character.sante },
  ];

  const swipeConfig: GestureRecognizerProps["config"] = {
    velocityThreshold: 0.2,
    directionalOffsetThreshold: 80,
  };

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
      interruptionModeAndroid: "duckOthers",
    });
    const player = createAudioPlayer(require("../../sounds/page.aac"));
    flipSound.current = player;
    return () => {
      player.remove();
    };
  }, []);

  const handleFlip = () => {
    flipSound.current?.seekTo(0);
    flipSound.current?.play();
    if (isBack) {
      frontScrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      backScrollRef.current?.scrollTo({ y: 0, animated: true });
    }
    cardRef.current?.flip();
    setIsBack((prev) => !prev);
  };

  return (
    <Layout backgroundColor="gradient" className="flex-1">
      <CardFlip style={{ width, height }} ref={cardRef}>
        <GestureRecognizer
          onSwipeLeft={handleFlip} // swipe right to left to show back
          config={swipeConfig}
          style={{ flex: 1 }}
        >
          <Layout
            backgroundColor="gradient"
            variant="scroll"
            className="px-4 py-6"
            ref={frontScrollRef}
          >
            <View className="mb-6">
              <Title className="text-center text-3xl font-bold text-white tracking-widest">
                {character.name}
              </Title>
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-blue-600">
              <Title className="text-white text-xl font-semibold mb-3">
                Caractéristiques
              </Title>
              {stats.map((stat) => (
                <View
                  key={stat.label}
                  className="flex-row justify-between mb-1"
                >
                  <Body className="text-white">{stat.label}</Body>
                  <Body className="text-white">{stat.value}</Body>
                </View>
              ))}
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-green-600">
              <Title className="text-green-300 text-xl font-semibold mb-3">
                Métier & Spécialités
              </Title>
              {character.profession_name ? (
                <View className="flex-row justify-between">
                  <Body className="text-white">
                    {character.profession_name}
                  </Body>
                  <Body className="text-white">
                    {character.profession_score}
                  </Body>
                </View>
              ) : (
                <Body className="text-white">Aucun</Body>
              )}
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-orange-600">
              <Title className="text-orange-300 text-xl font-semibold mb-3">
                Hobbies
              </Title>
              {character.hobby_name ? (
                <View className="flex-row justify-between">
                  <Body className="text-white">{character.hobby_name}</Body>
                  <Body className="text-white">{character.hobby_score}</Body>
                </View>
              ) : (
                <Body className="text-white">Aucun</Body>
              )}
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-purple-600">
              <Title className="text-purple-300 text-xl font-semibold mb-3">
                Voie étrange
              </Title>
              {character.voie_name ? (
                <>
                  <View className="flex-row justify-between">
                    <Body className="text-white">{character.voie_name}</Body>
                    <Body className="text-white">{character.voie_score}</Body>
                  </View>
                  {capacites && capacites.length > 0 ? (
                    capacites.map((cap: any) => (
                      <View
                        key={cap.id}
                        className="flex-row justify-between ml-4 mt-1"
                      >
                        <Body className="text-purple-200">{cap.name}</Body>
                        <Body className="text-purple-200">{cap.level}</Body>
                      </View>
                    ))
                  ) : (
                    <Body className="text-white">Aucune capacité</Body>
                  )}
                </>
              ) : (
                <Body className="text-white">Aucune</Body>
              )}
            </View>
          </Layout>
        </GestureRecognizer>
        <GestureRecognizer
          onSwipeRight={handleFlip} // swipe left to right to return front
          config={swipeConfig}
          style={{ flex: 1 }}
        >
          <Layout
            backgroundColor="gradient"
            variant="scroll"
            className="px-4 py-6"
            ref={backScrollRef}
          >
            <View className="mb-6">
              <Title className="text-center text-3xl font-bold text-purple-300 tracking-widest">
                HISTORIQUE & NOTES
              </Title>
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-purple-600">
              <Title className="text-purple-300 text-xl font-semibold mb-3">
                Origines & Parcours
              </Title>
              <TextInput
                placeholder="Décrivez l'origine et l'histoire de votre personnage..."
                placeholderTextColor="#aaa"
                multiline
                style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 150,
                  textAlignVertical: "top",
                }}
              />
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-indigo-600">
              <Title className="text-indigo-300 text-xl font-semibold mb-3">
                Rencontres & Alliés
              </Title>
              <TextInput
                placeholder="Listez les rencontres marquantes et vos alliés..."
                placeholderTextColor="#aaa"
                multiline
                style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 120,
                  textAlignVertical: "top",
                }}
              />
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-red-600">
              <Title className="text-red-300 text-xl font-semibold mb-3">
                Notes
              </Title>
              <TextInput
                placeholder="Vos réflexions, hypothèses..."
                placeholderTextColor="#aaa"
                multiline
                style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 120,
                  textAlignVertical: "top",
                }}
              />
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-yellow-600">
              <Title className="text-yellow-300 text-xl font-semibold mb-3">
                Équipement
              </Title>
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-teal-600">
              <Title className="text-teal-300 text-xl font-semibold mb-3">
                Effets déclenchés / Objets fétiches
              </Title>
              <TextInput
                placeholder="Décrivez les effets spéciaux ou vos objets fétiches..."
                placeholderTextColor="#aaa"
                multiline
                style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 120,
                  textAlignVertical: "top",
                }}
              />
            </View>

            <View className="mt-6">
              <Caption className="text-gray-500 text-center">
                Étrange France © 2025 - Dossier confidentiel
              </Caption>
            </View>
          </Layout>
        </GestureRecognizer>
      </CardFlip>
    </Layout>
  );
}
