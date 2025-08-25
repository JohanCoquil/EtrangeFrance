import React, { useRef, useEffect, useState } from "react";
import {
  View,
  TextInput,
  Dimensions,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import {
  RouteProp,
  useRoute,
  useNavigation,
} from "@react-navigation/native";
import { Layout, Title, Body, Caption, Button } from "../components/ui";
import { RootStackParamList } from "../navigation/types";
import { useCharacters, useUpdateCharacterSheet } from "@/api/charactersLocal";
import { useCharacterCapacites } from "@/api/capacitiesLocal";
import CardFlip, { CardFlipRef } from "@/components/CardFlip";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Dices } from "lucide-react-native";

export default function CharacterSheet() {
  const route = useRoute<RouteProp<RootStackParamList, "CharacterSheet">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { characterId } = route.params;
  const { width, height } = Dimensions.get("window");
  const cardRef = useRef<CardFlipRef>(null);
  const flipSound = useRef<Audio.Sound | null>(null);
  const frontScrollRef = useRef<ScrollView>(null);
  const backScrollRef = useRef<ScrollView>(null);
  const [isBack, setIsBack] = useState(false);
  const [origines, setOrigines] = useState("");
  const [rencontres, setRencontres] = useState("");
  const [notes, setNotes] = useState("");
  const [equipement, setEquipement] = useState("");
  const [fetiches, setFetiches] = useState("");
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [selectedExtra, setSelectedExtra] = useState<
    | { type: string; id?: number; name: string; value: number }
    | null
  >(null);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const updateSheet = useUpdateCharacterSheet();
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

  useEffect(() => {
    if (character) {
      setOrigines(character.origines ?? "");
      setRencontres(character.rencontres ?? "");
      setNotes(character.notes ?? "");
      setEquipement(character.equipement ?? "");
      setFetiches(character.fetiches ?? "");
    }
  }, [character]);

  const skipSave = useRef(true);
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      updateSheet.mutate({
        id: characterId,
        origines,
        rencontres,
        notes,
        equipement,
        fetiches,
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [origines, rencontres, notes, equipement, fetiches, characterId]);

  const forceCapacite = (capacites as any[])?.find((c: any) => c.id === 22);
  const dexCapacite = (capacites as any[])?.find((c: any) => c.id === 1);

  const stats = [
    {
      label: "Force",
      value: character.force + (forceCapacite?.level ?? 0),
      base: character.force,
      bonus: forceCapacite?.level ?? 0,
    },
    {
      label: "Dextérité",
      value: character.dexterite + (dexCapacite?.level ?? 0),
      base: character.dexterite,
      bonus: dexCapacite?.level ?? 0,
    },
    { label: "Intelligence", value: character.intelligence },
    { label: "Charisme", value: character.charisme },
    { label: "Mémoire", value: character.memoire },
    { label: "Volonté", value: character.volonte },
    {
      label: "Santé",
      value: Math.max(0, character.sante - (character.degats ?? 0)),
      max: character.sante,
    },
  ];

  const difficulties = [
    { label: "Facile", value: 5 },
    { label: "Normal", value: 10 },
    { label: "Difficile", value: 12 },
    { label: "Très difficile", value: 15 },
    { label: "Quasi impossible", value: 20 },
  ];

  const handleSelectExtra = (
    item: { type: string; id?: number; name: string; value: number }
  ) => {
    if (
      selectedExtra &&
      selectedExtra.type === item.type &&
      selectedExtra.id === item.id &&
      selectedExtra.name === item.name
    ) {
      setSelectedExtra(null);
    } else {
      setSelectedExtra(item);
    }
  };

  const handleDifficultySelect = (value: number) => {
    const statObj = stats.find((s) => s.label === selectedStat);
    navigation.navigate("CardDraw", {
      difficulty: value,
      statName: selectedStat || undefined,
      statValue: statObj?.value,
      extraName: selectedExtra?.name,
      extraValue: selectedExtra?.value,
      characterName: character.name,
      characterId: characterId,
    });
    setShowDifficulty(false);
  };

  useEffect(() => {
    const setup = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        require("../../sounds/page.aac")
      );
      flipSound.current = sound;
    };
    setup();
    return () => {
      flipSound.current?.unloadAsync();
    };
  }, []);

  const SWIPE_FLIP_THRESHOLD = 50;

  const createPanHandlers = (direction: "left" | "right") => {
    const onHandlerStateChange = (event: any) => {
      const { state, translationX, translationY, velocityX } =
        event.nativeEvent;

      if (
        state === State.END ||
        state === State.CANCELLED ||
        state === State.FAILED
      ) {
        const strongDistance = Math.abs(translationX) > SWIPE_FLIP_THRESHOLD;
        const strongVelocity = Math.abs(velocityX) > 600;

        if (
          (strongDistance || strongVelocity) &&
          Math.abs(translationX) > Math.abs(translationY)
        ) {
          if (direction === "left" && translationX < 0) {
            flipSound.current?.replayAsync();
            handleFlip();
          }
          if (direction === "right" && translationX > 0) {
            flipSound.current?.replayAsync();
            handleFlip();
          }
        }
      }
    };

    return { onHandlerStateChange };
  };

  const frontPan = createPanHandlers("left");
  const backPan = createPanHandlers("right");

  const handleFlip = () => {
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
      <Pressable
        className="absolute top-4 right-4 z-10"
        disabled={!selectedStat && !selectedExtra}
        onPress={() => setShowDifficulty(true)}
      >
        <Dices
          size={32}
          color={selectedStat || selectedExtra ? "#fff" : "#666"}
        />
      </Pressable>
      <CardFlip style={{ width, height }} ref={cardRef}>
        <PanGestureHandler
          onHandlerStateChange={frontPan.onHandlerStateChange}
          activeOffsetX={[-40, 40]}
          failOffsetY={[-12, 12]}
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
              {stats.map((stat) => {
                const displayValue =
                  stat.label === "Santé"
                    ? `${stat.value} / ${stat.max}`
                    : stat.bonus && stat.bonus > 0
                        ? `${stat.value} (${stat.base} + ${stat.bonus})`
                        : stat.value;
                if (stat.label === "Santé") {
                  return (
                    <View
                      key={stat.label}
                      className="flex-row justify-between mb-1"
                    >
                      <Body className="text-white">{stat.label}</Body>
                      <Body className="text-white">{displayValue}</Body>
                    </View>
                  );
                }
                const isSelected = selectedStat === stat.label;
                return (
                  <Pressable
                    key={stat.label}
                    onPress={() =>
                      setSelectedStat(isSelected ? null : stat.label)
                    }
                    className={`flex-row justify-between mb-1 p-1 rounded ${
                      isSelected
                        ? "border border-yellow-400 bg-yellow-400/10"
                        : ""
                    }`}
                  >
                    <Body
                      className={`text-white ${
                        isSelected ? "font-bold text-yellow-400" : ""
                      }`}
                    >
                      {stat.label}
                    </Body>
                    <Body
                      className={`text-white ${
                        isSelected ? "font-bold text-yellow-400" : ""
                      }`}
                    >
                      {displayValue}
                    </Body>
                  </Pressable>
                );
              })}
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-green-600">
              <Title className="text-green-300 text-xl font-semibold mb-3">
                Métier & Spécialités
              </Title>
              {character.profession_name ? (
                (() => {
                  const isSelected = selectedExtra?.type === "profession";
                  return (
                    <Pressable
                      className={`flex-row justify-between p-1 rounded ${
                        isSelected
                          ? "border border-yellow-400 bg-yellow-400/10"
                          : ""
                      }`}
                      onPress={() =>
                        handleSelectExtra({
                          type: "profession",
                          name: character.profession_name,
                          value: character.profession_score,
                        })
                      }
                    >
                      <Body
                        className={`text-white ${
                          isSelected ? "font-bold text-yellow-400" : ""
                        }`}
                      >
                        {character.profession_name}
                      </Body>
                      <Body
                        className={`text-white ${
                          isSelected ? "font-bold text-yellow-400" : ""
                        }`}
                      >
                        {character.profession_score}
                      </Body>
                    </Pressable>
                  );
                })()
              ) : (
                <Body className="text-white">Aucun</Body>
              )}
            </View>

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-orange-600">
              <Title className="text-orange-300 text-xl font-semibold mb-3">
                Hobbies
              </Title>
              {character.hobby_name ? (
                (() => {
                  const isSelected = selectedExtra?.type === "hobby";
                  return (
                    <Pressable
                      className={`flex-row justify-between p-1 rounded ${
                        isSelected
                          ? "border border-yellow-400 bg-yellow-400/10"
                          : ""
                      }`}
                      onPress={() =>
                        handleSelectExtra({
                          type: "hobby",
                          name: character.hobby_name,
                          value: character.hobby_score,
                        })
                      }
                    >
                      <Body
                        className={`text-white ${
                          isSelected ? "font-bold text-yellow-400" : ""
                        }`}
                      >
                        {character.hobby_name}
                      </Body>
                      <Body
                        className={`text-white ${
                          isSelected ? "font-bold text-yellow-400" : ""
                        }`}
                      >
                        {character.hobby_score}
                      </Body>
                    </Pressable>
                  );
                })()
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
                  {(() => {
                    const isSelected = selectedExtra?.type === "voie";
                    return (
                      <Pressable
                        className={`flex-row justify-between p-1 rounded ${
                          isSelected
                            ? "border border-yellow-400 bg-yellow-400/10"
                            : ""
                        }`}
                        onPress={() =>
                          handleSelectExtra({
                            type: "voie",
                            name: character.voie_name,
                            value: character.voie_score,
                          })
                        }
                      >
                        <Body
                          className={`text-white ${
                            isSelected ? "font-bold text-yellow-400" : ""
                          }`}
                        >
                          {character.voie_name}
                          {character.voie_name === "Druide" && character.divinity_name
                            ? ` (${character.divinity_name}${
                                character.divinity_domaine
                                  ? ` - ${character.divinity_domaine}`
                                  : ""
                              })`
                            : ""}
                        </Body>
                        <Body
                          className={`text-white ${
                            isSelected ? "font-bold text-yellow-400" : ""
                          }`}
                        >
                          {character.voie_score}
                        </Body>
                      </Pressable>
                    );
                  })()}
                  {capacites && capacites.length > 0 ? (
                    capacites.map((cap: any) => {
                      const isCap =
                        selectedExtra?.type === "capacity" &&
                        selectedExtra.id === cap.id;
                      return (
                        <Pressable
                          key={cap.id}
                          className={`flex-row justify-between ml-4 mt-1 p-1 rounded ${
                            isCap
                              ? "border border-yellow-400 bg-yellow-400/10"
                              : ""
                          }`}
                          onPress={() =>
                            handleSelectExtra({
                              type: "capacity",
                              id: cap.id,
                              name: cap.name,
                              value: cap.level,
                            })
                          }
                        >
                          <Body
                            className={`${
                              isCap
                                ? "font-bold text-yellow-400"
                                : "text-purple-200"
                            }`}
                          >
                            {cap.name}
                          </Body>
                          <Body
                            className={`${
                              isCap
                                ? "font-bold text-yellow-400"
                                : "text-purple-200"
                            }`}
                          >
                            {cap.level}
                          </Body>
                        </Pressable>
                      );
                    })
                  ) : (
                    <Body className="text-white">Aucune capacité</Body>
                  )}
                </>
              ) : (
                <Body className="text-white">Aucune</Body>
              )}
            </View>
          </Layout>
        </PanGestureHandler>
        <PanGestureHandler
          onHandlerStateChange={backPan.onHandlerStateChange}
          activeOffsetX={[-40, 40]}
          failOffsetY={[-12, 12]}
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
                value={origines}
                onChangeText={setOrigines}
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
                value={rencontres}
                onChangeText={setRencontres}
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
                value={notes}
                onChangeText={setNotes}
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
              <TextInput
                placeholder="Listez votre équipement et vos objets..."
                placeholderTextColor="#aaa"
                multiline
                value={equipement}
                onChangeText={setEquipement}
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

            <View className="bg-gray-800/70 rounded-2xl p-4 mb-5 border border-teal-600">
              <Title className="text-teal-300 text-xl font-semibold mb-3">
                Effets déclenchés / Objets fétiches
              </Title>
              <TextInput
                placeholder="Décrivez les effets spéciaux ou vos objets fétiches..."
                placeholderTextColor="#aaa"
                multiline
                value={fetiches}
                onChangeText={setFetiches}
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
        </PanGestureHandler>
      </CardFlip>
      <Modal visible={showDifficulty} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-gray-800 p-4 rounded-xl w-4/5">
            <Title className="text-white text-center mb-4">
              Niveau de difficulté
            </Title>
            {difficulties.map((d) => (
              <Button
                key={d.value}
                className="mb-2"
                onPress={() => handleDifficultySelect(d.value)}
              >
                {d.label} ({d.value})
              </Button>
            ))}
            <Button
              variant="secondary"
              onPress={() => setShowDifficulty(false)}
            >
              Annuler
            </Button>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}
