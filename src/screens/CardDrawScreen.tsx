import React, { useState, useEffect } from "react";
import { Pressable, View, StyleSheet, Text } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { suits } from "../data/deck";
import { useDeck } from "@/api/deckLocal";
import Card from "../components/game/Carte";
import PotCard, { PotCardType } from "../components/game/PotCard";
import { Button, Layout } from "../components/ui";
import { RotateCcw } from "lucide-react-native";
import { useCharacters } from "@/api/charactersLocal";

// Nombre de dos de cartes affichés pendant le mélange
const NUM_BACK_CARDS = 10;

// Génère des facteurs aléatoires pour les animations de chaque carte
const generateRandomFactors = () =>
  Array.from({ length: NUM_BACK_CARDS }, () => ({
    dirX: Math.random() > 0.5 ? 1 : -1,
    dirY: Math.random() > 0.5 ? 1 : -1,
    ampX: Math.random() * 1.5 + 0.5, // amplitude horizontale
    ampY: Math.random() * 0.5, // légère variation verticale
    rot: (Math.random() - 0.5) * 1, // rotation aléatoire
  }));

export default function CardDrawScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "CardDraw">>();
  const {
    difficulty,
    statName,
    statValue = 0,
    extraName,
    extraValue = 0,
    extraType,
    extraId,
    extra2Name,
    extra2Value = 0,
    extra2Type,
    extra2Id,
    characterName,
    characterId,
  } = route.params;
  const { data: deckRows } = useDeck(characterId);
  const { data: characters } = useCharacters();
  const character: any = characters?.find((c: any) => c.id === characterId);
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<
    { value: string; suit: { symbol: string; color: string } }[] | null
  >(null);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [randomFactors, setRandomFactors] = useState(generateRandomFactors);
  const [mode, setMode] = useState<"classic" | "advantage" | "disadvantage">(
    "classic",
  );
  const [cardValue, setCardValue] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [deckCards, setDeckCards] = useState<
    { value: string; suit: { symbol: string; color: string } }[]
  >([]);
  const [potCards, setPotCards] = useState<PotCardType[]>([]);
  const [initialSuit, setInitialSuit] = useState<
    { symbol: string; color: string } | null
  >(null);
  const [triggerDescription, setTriggerDescription] = useState<string | null>(null);
  const triggerEffects = character?.trigger_effects
    ? JSON.parse(character.trigger_effects)
    : [];

  const translateX = useSharedValue(0);

  const animStyles = randomFactors.map(({ dirX, dirY, ampX, ampY, rot }) =>
    useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value * dirX * ampX },
        { translateY: translateX.value * dirY * ampY },
        { rotate: `${translateX.value * rot}deg` },
      ],
    })),
  );

  useEffect(() => {
    if (!deckRows) return;
    const cards: { value: string; suit: { symbol: string; color: string } }[] = [];
    let suitForPot: { symbol: string; color: string } | null = null;
    (deckRows as any[]).forEach((row) => {
      const suit = suits.find((s) => s.name === row.figure);
      if (suit && row.cards) {
        row.cards.split(';').forEach((val: string) => {
          cards.push({ value: val, suit });
        });
        if (!suitForPot) suitForPot = suit;
      }
    });
    setDeckCards(cards);
    if (suitForPot) {
      setInitialSuit(suitForPot);
      setPotCards([
        { value: 'J', suit: suitForPot, faceUp: false, inDeck: false },
        { value: 'Q', suit: suitForPot, faceUp: false, inDeck: false },
        { value: 'K', suit: suitForPot, faceUp: false, inDeck: false },
      ]);
    }
  }, [deckRows]);

  const drawRandomCard = (exclude: number[] = []) => {
    const availableIndices = deckCards
      .map((_, i) => i)
      .filter((i) => !exclude.includes(i));
    if (availableIndices.length === 0) return null;
    const index =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    return { card: deckCards[index], index };
  };

  const addPotCardToDeck = (value: string) => {
    const potCard = potCards.find(
      (c) => c.value === value && !c.inDeck && !c.faceUp,
    );
    if (!potCard) return;
    setDeckCards((prev) => [...prev, { value: potCard.value, suit: potCard.suit }]);
    setPotCards((prev) =>
      prev.map((c) => (c.value === value ? { ...c, inDeck: true } : c)),
    );
  };

  const handleDrawnPotCards = (
    cards: { value: string; suit: { symbol: string; color: string } }[],
  ) => {
    cards.forEach((card) => {
      const potCard = potCards.find(
        (c) => c.value === card.value && c.inDeck,
      );
      if (potCard) {
        setDeckCards((prev) =>
          prev.filter(
            (c) =>
              !(
                c.value === card.value &&
                c.suit.symbol === card.suit.symbol
              ),
          ),
        );
        setPotCards((prev) =>
          prev.map((c) =>
            c.value === card.value ? { ...c, inDeck: false, faceUp: true } : c,
          ),
        );
      }
    });
  };

  const resetDeckAndPot = () => {
    if (!deckRows || !initialSuit) return;
    const cards: { value: string; suit: { symbol: string; color: string } }[] = [];
    (deckRows as any[]).forEach((row) => {
      const suit = suits.find((s) => s.name === row.figure);
      if (suit && row.cards) {
        row.cards.split(';').forEach((val: string) => {
          cards.push({ value: val, suit });
        });
      }
    });
    setDeckCards(cards);
    setPotCards([
      { value: 'J', suit: initialSuit, faceUp: false, inDeck: false },
      { value: 'Q', suit: initialSuit, faceUp: false, inDeck: false },
      { value: 'K', suit: initialSuit, faceUp: false, inDeck: false },
    ]);
    setDrawnCards(null);
    setChosenIndex(null);
    setCardValue(null);
    setResult(null);
    setTriggerDescription(null);
  };

  const valueOrder = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const cardValues: Record<string, number> = {
    A: 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 10,
    Q: 10,
    K: 10,
  };

  const checkTrigger = (
    card: { value: string; suit: { symbol: string } },
  ): string | null => {
    let trig: any = null;
    if (extraType) {
      trig = triggerEffects.find(
        (t: any) =>
          t.type === extraType &&
          (extraType === "capacity" ? t.id === extraId : t.name === extraName) &&
          t.cardValue === card.value &&
          t.cardSuit === card.suit.symbol,
      );
    }
    if (!trig && extra2Type) {
      trig = triggerEffects.find(
        (t: any) =>
          t.type === extra2Type &&
          (extra2Type === "capacity" ? t.id === extra2Id : t.name === extra2Name) &&
          t.cardValue === card.value &&
          t.cardSuit === card.suit.symbol,
      );
    }
    if (!trig && statName) {
      trig = triggerEffects.find(
        (t: any) =>
          t.type === "stat" &&
          t.name === statName &&
          t.cardValue === card.value &&
          t.cardSuit === card.suit.symbol,
      );
    }
    return trig ? trig.description : null;
  };

  const handlePress = () => {
    if (!isShuffling && !drawnCards) {
      if (deckCards.length === 0) return;
      setRandomFactors(generateRandomFactors());
      setIsShuffling(true);
      translateX.value = withRepeat(
        withTiming(15, { duration: 150 }),
        -1,
        true,
      );
    } else if (isShuffling) {
      setIsShuffling(false);
      cancelAnimation(translateX);
      translateX.value = 0;
      const firstDraw = drawRandomCard();
      if (!firstDraw) return;
      const { card: card1, index: index1 } = firstDraw;
      if (mode === "classic") {
        setDrawnCards([card1]);
        setChosenIndex(0);
        const cv = cardValues[card1.value];
        const total = cv + statValue + extraValue + extra2Value;
        setCardValue(cv);
        setResult(total);
        handleDrawnPotCards([card1]);
        const trigDesc = checkTrigger(card1);
        if (trigDesc && total >= difficulty) {
          setTriggerDescription(trigDesc);
        } else {
          setTriggerDescription(null);
        }
      } else {
        const secondDraw = drawRandomCard([index1]);
        if (!secondDraw) return;
        const { card: card2 } = secondDraw;
        const rank1 = valueOrder.indexOf(card1.value);
        const rank2 = valueOrder.indexOf(card2.value);
        const chosen =
          mode === "advantage"
            ? rank1 >= rank2
              ? 0
              : 1
            : rank1 <= rank2
              ? 0
              : 1;
        setDrawnCards([card1, card2]);
        setChosenIndex(chosen);
        const chosenCard = chosen === 0 ? card1 : card2;
        const cv = cardValues[chosenCard.value];
        const total = cv + statValue + extraValue + extra2Value;
        setCardValue(cv);
        setResult(total);
        handleDrawnPotCards([card1, card2]);
        const trigDesc = checkTrigger(chosenCard);
        if (trigDesc && total >= difficulty) {
          setTriggerDescription(trigDesc);
        } else {
          setTriggerDescription(null);
        }
      }
    } else if (drawnCards) {
      setDrawnCards(null);
      setChosenIndex(null);
      setCardValue(null);
      setResult(null);
      setTriggerDescription(null);
    }
  };

  return (
    <Layout backgroundColor="gradient" className="relative flex-1">
      <View style={styles.modeSelector}>
        <Button
          size="sm"
          variant={mode === "classic" ? "primary" : "secondary"}
          onPress={() => setMode("classic")}
          className="mx-1"
        >
          Tirage classique
        </Button>
        <Button
          size="sm"
          variant={mode === "advantage" ? "primary" : "secondary"}
          onPress={() => setMode("advantage")}
          className="mx-1"
        >
          Avantage
        </Button>
        <Button
          size="sm"
          variant={mode === "disadvantage" ? "primary" : "secondary"}
          onPress={() => setMode("disadvantage")}
          className="mx-1"
        >
          Désavantage
        </Button>
      </View>
      <View style={styles.potRow}>
        <View style={styles.pot}>
          {potCards
            .filter((c) => !c.inDeck)
            .map((c) => (
              <PotCard
                key={c.value}
                card={c}
                onAddToDeck={() => addPotCardToDeck(c.value)}
              />
            ))}
        </View>
        <Button size="sm" variant="secondary" onPress={resetDeckAndPot}>
          <RotateCcw color="#fff" size={16} />
        </Button>
      </View>
      <Text style={styles.characterName}>{characterName}</Text>
      <Pressable style={styles.pressableArea} onPress={handlePress}>
        <View style={styles.deckContainer}>
          {Array.from({ length: NUM_BACK_CARDS }).map((_, i) => (
            <Animated.View key={i} style={[styles.deck, animStyles[i]]}>
              <View style={styles.cardBack}>
                <Text style={styles.backText}>Étrange France</Text>
              </View>
            </Animated.View>
          ))}

          {drawnCards && (
            <View style={styles.drawnCardsContainer}>
              {drawnCards.map((card, index) => (
                <View key={index} style={styles.singleCard}>
                  <Card
                    value={card.value}
                    suit={card.suit}
                    crossed={drawnCards.length > 1 && index !== chosenIndex}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.resultBox}>
          {result !== null && cardValue !== null && (
            <>
              <Text style={styles.resultText}>{`${[
                `Carte: ${cardValue}`,
                statName ? `${statName}: ${statValue}` : null,
                extraName ? `${extraName}: ${extraValue}` : null,
                extra2Name ? `${extra2Name}: ${extra2Value}` : null,
              ]
                .filter(Boolean)
                .join(" + ")} = ${result}`}</Text>
              <Text
                style={[
                  styles.resultText,
                  {
                    color: result >= difficulty ? "#22c55e" : "#ef4444",
                  },
                ]}
              >
                {result >= difficulty ? "REUSSITE" : "ECHEC"} (Difficulté{" "}
                {difficulty})
              </Text>
              {triggerDescription && (
                <Text style={styles.triggerText}>
                  {`Effet spécial : ${triggerDescription}`}
                </Text>
              )}
            </>
          )}
        </View>
      </Pressable>
    </Layout>
  );
}

const styles = StyleSheet.create({
  characterName: {
    position: "absolute",
    top: 210,
    alignSelf: "center",
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    zIndex: 2,
  },
  pressableArea: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  modeSelector: {
    position: "absolute",
    top: 40,
    flexDirection: "row",
    alignSelf: "center",
    zIndex: 1,
  },
  potRow: {
    position: "absolute",
    top: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    zIndex: 2,
  },
  pot: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#fff",
    padding: 4,
    borderRadius: 8,
    marginRight: 8,
    maxWidth: "100%",
  },
  deckContainer: {
    width: 140,
    height: 200,
    marginBottom: 10,
  },
  deck: {
    width: 140,
    height: 200,
    borderRadius: 15,
    backgroundColor: "#1f2937",
    borderWidth: 3,
    borderColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  cardBack: {
    width: 140,
    height: 200,
    borderRadius: 15,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#666",
  },
  backText: { color: "#888", fontSize: 14, fontWeight: "bold" },
  drawnCardsContainer: {
    position: "absolute",
    bottom: 100,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  singleCard: { marginHorizontal: 10 },
  resultBox: {
    width: "95%",
    padding: 12,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    alignItems: "center",
    minHeight: 96,
    maxHeight: 96,
    justifyContent: "center",
  },
  resultText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  triggerText: { color: "#3b82f6", textAlign: "center", marginTop: 4 },
});
