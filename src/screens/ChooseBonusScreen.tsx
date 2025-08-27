import { useState } from "react";
import { ScrollView, View, TextInput, Modal, Pressable } from "react-native";
import { Layout, Title, Body, Button, Card, Caption } from "../components/ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import {
  useUpdateBonuses,
  useCharacters,
  useUpdateCharacterSheet,
  useUpdateTriggerEffects,
} from "@/api/charactersLocal";
import {
  useCapacitesByVoie,
  useCharacterCapacites,
  useUpdateCharacterCapacites,
} from "@/api/capacitiesLocal";
import { Info } from "lucide-react-native";
import { useDeck } from "@/api/deckLocal";
import { suits } from "../data/deck";
import Carte from "@/components/game/Carte";

const bonusOptions = [
  {
    id: "influence",
    title: "Influence Sociale Augmentée",
    description:
      "Choisis un milieu d'influence où tu te fais aisément des relations.",
  },
  {
    id: "objet",
    title: "Objet Spécial lié à l’Histoire",
    description:
      "Un objet fétiche permettant d'ajouter une carte JOKER lors des tirages le concernant.",
  },
  {
    id: "competence",
    title: "+1 à une Compétence ou Spécialisation",
    description:
      "Développe une nouvelle compétence ou spécialisation avec un bonus de +1.",
  },
  {
    id: "richesse",
    title: "Richesse Augmentée",
    description:
      "Gagne un niveau de richesse et change de classe sociale selon ton métier.",
  },
  {
    id: "specialite",
    title: "Nouvelle Spécialité Étrange",
    description:
      "Ajoute une spécialité étrange supplémentaire à ta voie choisie.",
  },
  {
    id: "effet",
    title: "Effet Déclenché",
    description:
      "Définit un effet spécial pour une compétence de niveau 2 ou plus lorsqu'une carte particulière est tirée.",
  },
];

const bonusDescriptions: Record<string, string> = {
  influence:
    "Le personnage peut choisir un milieu d’influence. Lorsqu’une action concerne cet aspect social du personnage, il peut ajouter la figure de son choix pour l’action. Le personnage est un animal social qui se fait des relations sans difficulté dans le cercle d’influence choisi. Il connaît probablement des personnes intéressantes si vous jouez dans une ville qu’il a déjà visitée.",
  objet:
    "Le personnage possède un objet spécial qui a une signification particulière pour lui. Cet objet permet au personnage d’ajouter une carte JOKER lors des tirages impliquant cet objet qui ne s’épuise jamais. Il peut s’agir, par exemple, d’une arme nommée Betsie, d’un outil multifonction, d’un animal de compagnie, d’un véhicule doté d’une des premières intelligences artificielles qui vous appelle Michael, etc.",
  competence:
    "Le personnage peut choisir d’augmenter de +1 une nouvelle compétence à laquelle il n’avait pas accès auparavant. Alternativement, il peut choisir de développer une spécialisation dans un métier ou un hobby existant.",
  richesse:
    "Le personnage gagne un niveau de richesse supplémentaire, ce qui le fait passer dans une classe sociale supérieure en se basant sur son métier d’origine.",
  specialite:
    "Le personnage peut choisir une nouvelle spécialité étrange dans le type de voie qu’il a choisi précédemment.",
  effet:
    "Le personnage peut choisir une compétence de niveau 2 ou plus (dans son métier ou son hobby) et définir un effet qui se déclenche lorsqu’une carte particulière est tirée. Cet effet peut varier en fonction de la compétence et peut être utilisé à des fins offensives ou non-violentes. Des exemples d’effets peuvent être trouvés dans la section «Combat Avancé».",
};

export default function ChooseBonusScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { characterId } = route.params;
  const [selected, setSelected] = useState<string[]>([]);
  const [showInfluenceModal, setShowInfluenceModal] = useState(false);
  const [influenceInput, setInfluenceInput] = useState("");
  const [influenceMilieu, setInfluenceMilieu] = useState("");
  const [showObjectModal, setShowObjectModal] = useState(false);
  const [objectNameInput, setObjectNameInput] = useState("");
  const [objectSpecInput, setObjectSpecInput] = useState("");
  const [objectName, setObjectName] = useState("");
  const [objectSpec, setObjectSpec] = useState("");
  const [showSpecialiteModal, setShowSpecialiteModal] = useState(false);
  const [specialiteId, setSpecialiteId] = useState<number | null>(null);
  const [showEffectModal, setShowEffectModal] = useState(false);
  const [effectTarget, setEffectTarget] = useState<any | null>(null);
  const [effectCard, setEffectCard] = useState<string | null>(null);
  const [effectDescriptionInput, setEffectDescriptionInput] = useState("");
  const [triggerEffect, setTriggerEffect] = useState<any | null>(null);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const updateBonuses = useUpdateBonuses();
  const { data: characters } = useCharacters();
  const character: any = characters?.find((c: any) => c.id === characterId);
  const updateSheet = useUpdateCharacterSheet();
  const updateTriggers = useUpdateTriggerEffects();
  const updateCapacites = useUpdateCharacterCapacites();
  const { data: characterCapacites } = useCharacterCapacites(characterId);
  const { data: voieCapacites } = useCapacitesByVoie(character?.voie_id ?? 0);
  const availableSpecialites =
    voieCapacites?.filter(
      (cap: any) => !characterCapacites?.some((c: any) => c.id === cap.id),
    ) ?? [];
  const { data: deckRows } = useDeck(characterId);
  const deckSuit =
    (deckRows && deckRows[0]
      ? suits.find((s) => s.name === deckRows[0].figure)
      : suits[0]) || suits[0];

  const effectOptions: any[] = [];
  if (character) {
    const stats = [
      { type: "stat", name: "Force", value: character.force },
      { type: "stat", name: "Dextérité", value: character.dexterite },
      { type: "stat", name: "Intelligence", value: character.intelligence },
      { type: "stat", name: "Charisme", value: character.charisme },
      { type: "stat", name: "Mémoire", value: character.memoire },
      { type: "stat", name: "Volonté", value: character.volonte },
    ].filter((s) => s.value >= 2);
    effectOptions.push(...stats);
    if (character.profession_score >= 2 && character.profession_name) {
      effectOptions.push({
        type: "profession",
        name: character.profession_name,
        value: character.profession_score,
      });
    }
    if (character.hobby_score >= 2 && character.hobby_name) {
      effectOptions.push({
        type: "hobby",
        name: character.hobby_name,
        value: character.hobby_score,
      });
    }
    if (character.voie_score >= 2 && character.voie_name) {
      effectOptions.push({
        type: "voie",
        name: character.voie_name,
        value: character.voie_score,
      });
    }
    (characterCapacites ?? []).forEach((c: any) => {
      if (c.level >= 2) {
        effectOptions.push({
          type: "capacity",
          id: c.id,
          name: c.name,
          value: c.level,
        });
      }
    });
  }

  const toggle = (id: string) => {
    if (id === "influence") {
      if (selected.includes(id)) {
        setSelected((prev) => prev.filter((b) => b !== id));
        setInfluenceMilieu("");
      } else {
        if (selected.length >= 3) return;
        setInfluenceInput("");
        setShowInfluenceModal(true);
      }
      return;
    }
    if (id === "objet") {
      if (selected.includes(id)) {
        setSelected((prev) => prev.filter((b) => b !== id));
        setObjectName("");
        setObjectSpec("");
      } else {
        if (selected.length >= 3) return;
        setObjectNameInput("");
        setObjectSpecInput("");
        setShowObjectModal(true);
      }
      return;
    }
    if (id === "specialite") {
      if (selected.includes(id)) {
        setSelected((prev) => prev.filter((b) => b !== id));
        setSpecialiteId(null);
      } else {
        if (selected.length >= 3) return;
        setSpecialiteId(null);
        setShowSpecialiteModal(true);
      }
      return;
    }
    if (id === "effet") {
      if (selected.includes(id)) {
        setSelected((prev) => prev.filter((b) => b !== id));
        setTriggerEffect(null);
      } else {
        if (selected.length >= 3) return;
        setEffectTarget(null);
        setEffectCard(null);
        setEffectDescriptionInput("");
        setShowEffectModal(true);
      }
      return;
    }
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((b) => b !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (selected.length !== 3) {
      alert("Choisis exactement 3 bonus");
      return;
    }
    if (selected.includes("influence") && !influenceMilieu.trim()) {
      alert("Précise le milieu pour l'influence sociale");
      return;
    }
    if (
      selected.includes("objet") &&
      (!objectName.trim() || !objectSpec.trim())
    ) {
      alert("Précise le nom et la spécificité de l'objet");
      return;
    }
    if (selected.includes("specialite") && !specialiteId) {
      alert("Choisis une spécialité étrange");
      return;
    }
    if (selected.includes("effet") && !triggerEffect) {
      alert("Définis l'effet déclenché");
      return;
    }

    const proceed = () =>
      updateBonuses.mutate(
        { id: characterId, bonuses: selected },
        {
          onSuccess: () =>
            navigation.navigate("MainTabs", { screen: "Characters" }),
          onError: (err) => alert("❌ Erreur : " + err),
        },
      );

    const needsSheetUpdate =
      selected.includes("influence") ||
      selected.includes("objet") ||
      selected.includes("richesse") ||
      selected.includes("effet");

    const updateSheetIfNeeded = () => {
      if (needsSheetUpdate) {
        if (!character) {
          alert("❌ Erreur : personnage introuvable");
          return;
        }
        const newRencontres = selected.includes("influence")
          ? `${character.rencontres ? character.rencontres + "\n" : ""}Influence sociale augmentée - ${influenceMilieu}`
          : character.rencontres ?? "";
        let newFetiches = selected.includes("objet")
          ? `${character.fetiches ? character.fetiches + "\n" : ""}${objectName} - ${objectSpec}`
          : character.fetiches ?? "";
        let newTriggers = character.trigger_effects
          ? JSON.parse(character.trigger_effects)
          : [];
        if (selected.includes("effet") && triggerEffect) {
          const cardLabel = `${triggerEffect.cardValue}${triggerEffect.cardSuit}`;
          newFetiches = `${newFetiches ? newFetiches + "\n" : ""}${triggerEffect.target.name} - ${cardLabel} : ${triggerEffect.description}`;
          newTriggers = [
            ...newTriggers,
            {
              type: triggerEffect.target.type,
              id: triggerEffect.target.id,
              name: triggerEffect.target.name,
              cardValue: triggerEffect.cardValue,
              cardSuit: triggerEffect.cardSuit,
              description: triggerEffect.description,
            },
          ];
        }
        const newOrigines = selected.includes("richesse")
          ? `${character.origines ? character.origines + "\n" : ""}Richesse augmentée : Le personnage est particulièrement riche, ce qui le fait passer dans une classe sociale supérieure par rapport à son métier d’origine.`
          : character.origines ?? "";
        const doSheetUpdate = () =>
          updateSheet.mutate(
            {
              id: characterId,
              origines: newOrigines,
              rencontres: newRencontres,
              notes: character.notes ?? "",
              equipement: character.equipement ?? "",
              fetiches: newFetiches,
            },
            {
              onSuccess: proceed,
              onError: (err) => alert("❌ Erreur : " + err),
            },
          );
        if (selected.includes("effet") && triggerEffect) {
          updateTriggers.mutate(
            { id: characterId, triggers: newTriggers },
            {
              onSuccess: doSheetUpdate,
              onError: (err) => alert("❌ Erreur : " + err),
            },
          );
        } else {
          doSheetUpdate();
        }
      } else {
        proceed();
      }
    };

    if (selected.includes("specialite")) {
      const currentCaps =
        characterCapacites?.map((c: any) => ({
          capaciteId: c.id,
          level: c.level,
        })) ?? [];
      const newCaps = [
        ...currentCaps,
        { capaciteId: specialiteId!, level: 1 },
      ];
      updateCapacites.mutate(
        { characterId, capacites: newCaps },
        {
          onSuccess: updateSheetIfNeeded,
          onError: (err) => alert("❌ Erreur : " + err),
        },
      );
    } else {
      updateSheetIfNeeded();
    }
  };

  return (
    <Layout backgroundColor="gradient" className="flex-1 px-4">
      <View className="flex-1">
        <Title className="mb-6 text-center text-white text-3xl font-bold tracking-wide shadow-md">
          Choisis 3 bonus
        </Title>
        <ScrollView
          className="flex-1 mb-4"
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {bonusOptions.map((b) => (
            <Card
              key={b.id}
              className={`mb-4 p-5 rounded-xl ${
                selected.includes(b.id)
                  ? "bg-blue-900 border-2 border-blue-400"
                  : "bg-black/60 border border-gray-600"
              }`}
            >
              <View className="flex-row items-center mb-2">
                <Title className="text-blue-200 text-xl flex-1 mr-2">
                  {b.title}
                </Title>
                <Pressable
                  onPress={() =>
                    setInfoModal({
                      title: b.title,
                      description: bonusDescriptions[b.id],
                    })
                  }
                >
                  <Info size={20} color="#93c5fd" />
                </Pressable>
              </View>
              <Body className="text-gray-300 mb-3">{b.description}</Body>
              <Button
                variant="secondary"
                onPress={() => toggle(b.id)}
                className="bg-gray-800 border border-blue-400"
              >
                {selected.includes(b.id) ? "✅ Sélectionné" : "Choisir"}
              </Button>
            </Card>
          ))}
        </ScrollView>
      </View>
      <View className="pb-4">
        <Button
          variant="primary"
          onPress={handleConfirm}
          className="mb-2 py-4 bg-blue-800 border-2 border-blue-500 rounded-lg shadow-xl"
        >
          <Title className="text-white text-lg font-bold tracking-wide">
            🎁 Valider les Bonus
          </Title>
        </Button>
        <Caption className="text-center mt-2 text-gray-400 italic">
          Tu dois sélectionner exactement trois bonus pour compléter ton
          histoire.
        </Caption>
      </View>

      <Modal visible={showInfluenceModal} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/60 p-4">
          <View className="bg-gray-900 p-4 rounded-lg">
            <Title className="text-white text-xl mb-2">Milieu concerné</Title>
            <TextInput
              placeholder="Nom du milieu"
              value={influenceInput}
              onChangeText={setInfluenceInput}
              className="border border-blue-500 rounded-lg p-2 mb-3 text-white"
              placeholderTextColor="#aaa"
            />
            <View className="flex-row justify-between">
              <Button
                variant="secondary"
                onPress={() => setShowInfluenceModal(false)}
                className="flex-1 mr-2 bg-gray-700 border border-gray-500"
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  if (!influenceInput.trim()) {
                    alert("Veuillez saisir un milieu");
                    return;
                  }
                  setInfluenceMilieu(influenceInput.trim());
                  setSelected((prev) => [...prev, "influence"]);
                  setShowInfluenceModal(false);
                }}
                className="flex-1 ml-2 bg-blue-800 border border-blue-500"
              >
                Valider
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEffectModal} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/60 p-4">
          <View className="bg-gray-900 p-4 rounded-lg max-h-[80%]">
            <Title className="text-white text-xl mb-2">Effet déclenché</Title>
            {effectOptions.length > 0 ? (
              <ScrollView className="mb-3 max-h-40">
                {effectOptions.map((opt: any, idx: number) => (
                  <Pressable
                    key={idx}
                    onPress={() => setEffectTarget(opt)}
                    className={`p-2 mb-2 rounded ${
                      effectTarget === opt
                        ? "bg-blue-800 border border-blue-500"
                        : "bg-gray-800 border border-gray-600"
                    }`}
                  >
                    <Body className="text-white">{`${opt.name} (${opt.value})`}</Body>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Body className="text-white mb-3">
                Aucune option disponible
              </Body>
            )}
            <ScrollView horizontal className="mb-3">
              {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((v) => (
                <Pressable key={v} onPress={() => setEffectCard(v)} className="mr-2">
                  <View
                    style={{
                      transform: [{ scale: 0.6 }],
                      borderWidth: effectCard === v ? 2 : 0,
                      borderColor: "#3b82f6",
                      borderRadius: 8,
                    }}
                  >
                    <Carte value={v} suit={deckSuit} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              placeholder="Description de l'effet"
              value={effectDescriptionInput}
              onChangeText={setEffectDescriptionInput}
              className="border border-blue-500 rounded-lg p-2 mb-3 text-white"
              placeholderTextColor="#aaa"
            />
            <View className="flex-row justify-between">
              <Button
                variant="secondary"
                onPress={() => setShowEffectModal(false)}
                className="flex-1 mr-2 bg-gray-700 border border-gray-500"
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  if (!effectTarget || !effectCard || !effectDescriptionInput.trim()) {
                    alert("Veuillez compléter l'effet");
                    return;
                  }
                  setTriggerEffect({
                    target: effectTarget,
                    cardValue: effectCard,
                    cardSuit: deckSuit.symbol,
                    description: effectDescriptionInput.trim(),
                  });
                  setSelected((prev) => [...prev, "effet"]);
                  setShowEffectModal(false);
                }}
                className="flex-1 ml-2 bg-blue-800 border border-blue-500"
              >
                Valider
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showObjectModal} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/60 p-4">
          <View className="bg-gray-900 p-4 rounded-lg">
            <Title className="text-white text-xl mb-2">Objet spécial</Title>
            <TextInput
              placeholder="Nom de l'objet"
              value={objectNameInput}
              onChangeText={setObjectNameInput}
              className="border border-blue-500 rounded-lg p-2 mb-3 text-white"
              placeholderTextColor="#aaa"
            />
            <TextInput
              placeholder="Spécificité"
              value={objectSpecInput}
              onChangeText={setObjectSpecInput}
              className="border border-blue-500 rounded-lg p-2 mb-3 text-white"
              placeholderTextColor="#aaa"
            />
            <View className="flex-row justify-between">
              <Button
                variant="secondary"
                onPress={() => setShowObjectModal(false)}
                className="flex-1 mr-2 bg-gray-700 border border-gray-500"
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  if (!objectNameInput.trim() || !objectSpecInput.trim()) {
                    alert("Veuillez saisir le nom et la spécificité");
                    return;
                  }
                  setObjectName(objectNameInput.trim());
                  setObjectSpec(objectSpecInput.trim());
                  setSelected((prev) => [...prev, "objet"]);
                  setShowObjectModal(false);
                }}
                className="flex-1 ml-2 bg-blue-800 border border-blue-500"
              >
                Valider
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSpecialiteModal} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/60 p-4">
          <View className="bg-gray-900 p-4 rounded-lg max-h-[80%]">
            <Title className="text-white text-xl mb-2">Spécialité étrange</Title>
            {availableSpecialites.length > 0 ? (
              <ScrollView className="mb-3">
                {availableSpecialites.map((cap: any) => (
                  <Pressable
                    key={cap.id}
                    onPress={() => setSpecialiteId(cap.id)}
                    className={`p-2 mb-2 rounded ${
                      specialiteId === cap.id
                        ? "bg-blue-800 border border-blue-500"
                        : "bg-gray-800 border border-gray-600"
                    }`}
                  >
                    <Body className="text-white">{cap.name}</Body>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Body className="text-white mb-3">
                Aucune spécialité disponible
              </Body>
            )}
            <View className="flex-row justify-between">
              <Button
                variant="secondary"
                onPress={() => setShowSpecialiteModal(false)}
                className="flex-1 mr-2 bg-gray-700 border border-gray-500"
              >
                Annuler
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  if (!specialiteId) {
                    alert("Choisis une spécialité");
                    return;
                  }
                  setSelected((prev) => [...prev, "specialite"]);
                  setShowSpecialiteModal(false);
                }}
                className="flex-1 ml-2 bg-blue-800 border border-blue-500"
              >
                Valider
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!infoModal} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/60 p-4">
          <View className="bg-gray-900 p-4 rounded-lg">
            <Title className="text-white text-xl mb-2">
              {infoModal?.title}
            </Title>
            <Body className="text-gray-200 mb-4">{infoModal?.description}</Body>
            <Button
              variant="secondary"
              onPress={() => setInfoModal(null)}
              className="self-end bg-gray-700 border border-gray-500"
            >
              Fermer
            </Button>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}
