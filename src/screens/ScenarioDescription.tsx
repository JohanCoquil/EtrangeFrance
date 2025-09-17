import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Layout from "@/components/ui/Layout";
import { RouteProp, useRoute } from "@react-navigation/native";
import { ScenariosStackParamList } from "@/navigation/ScenariosNavigator";

const sectionContainerClass = "bg-white/10 rounded-xl p-4 mb-6";
const sectionTitleClass = "text-white text-lg font-semibold mb-2";
const sectionContentClass = "text-white text-base leading-6";

type ScenarioDescriptionRouteProp = RouteProp<
  ScenariosStackParamList,
  "ScenarioDescription"
>;

export default function ScenarioDescriptionScreen() {
  const route = useRoute<ScenarioDescriptionRouteProp>();
  const { scenario } = route.params;

  const pitchText = useMemo(() => scenario.pitch?.trim() ?? "", [scenario.pitch]);
  const secretsText = useMemo(
    () => scenario.secrets?.trim() ?? "",
    [scenario.secrets],
  );

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        <Text className="text-white text-2xl font-bold mb-6 text-center">
          {scenario.titre}
        </Text>
        <View className={sectionContainerClass}>
          <Text className={sectionTitleClass}>Pitch</Text>
          <Text className={sectionContentClass}>
            {pitchText.length > 0
              ? pitchText
              : "Aucun pitch disponible pour ce scénario."}
          </Text>
        </View>
        <View className={sectionContainerClass}>
          <Text className={sectionTitleClass}>Secret</Text>
          <Text className={sectionContentClass}>
            {secretsText.length > 0
              ? secretsText
              : "Aucun secret n'a été renseigné pour ce scénario."}
          </Text>
        </View>
      </View>
    </Layout>
  );
}
