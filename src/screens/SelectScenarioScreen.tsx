import React, { useCallback, useState } from "react";
import { View, Text } from "react-native";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getDb } from "@/data/db";
import { Lock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ScenarioDetails,
  ScenariosStackParamList,
} from "@/navigation/ScenariosNavigator";

type SelectScenarioScreenNavigationProp = NativeStackNavigationProp<
  ScenariosStackParamList,
  "SelectScenario"
>;

export default function SelectScenarioScreen() {
  const navigation = useNavigation<SelectScenarioScreenNavigationProp>();
  const [scenarios, setScenarios] = useState<ScenarioDetails[]>([]);
  const [userLevel, setUserLevel] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadScenarios = async () => {
        try {
          const levelValue = await AsyncStorage.getItem("userLevel");
          if (isMounted) {
            const parsed = levelValue !== null ? Number(levelValue) : 0;
            setUserLevel(Number.isFinite(parsed) ? parsed : 0);
          }
        } catch (error) {
          console.error("Failed to load user level", error);
          if (isMounted) {
            setUserLevel(0);
          }
        }

        try {
          const db = getDb();
          const rows = (await db.getAllAsync(
            "SELECT id, titre, level, pitch, secrets FROM scenarios ORDER BY titre ASC",
          )) as ScenarioDetails[];
          if (isMounted) {
            setScenarios(rows);
          }
        } catch (error) {
          console.error("Failed to load scenarios", error);
        }
      };

      loadScenarios();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        {scenarios.map((scenario) => {
          const isUnlocked = scenario.level <= userLevel;

          return (
            <Button
              key={scenario.id}
              variant={isUnlocked ? "primary" : "secondary"}
              size="md"
              className="mb-4"
              onPress={() => {
                if (!isUnlocked) {
                  return;
                }
                navigation.navigate("ScenarioDescription", {
                  scenario,
                });
              }}
              disabled={!isUnlocked}
            >
              <View className="flex-row items-center">
                {!isUnlocked && <Lock color="#fff" size={16} />}
                <Text
                  className={`text-white text-base font-semibold ${!isUnlocked ? "ml-2" : ""}`}
                >
                  {scenario.titre}
                </Text>
              </View>
            </Button>
          );
        })}
        <Button variant="secondary" size="md" onPress={() => {}}>
          Créer mon scénario
        </Button>
      </View>
    </Layout>
  );
}

