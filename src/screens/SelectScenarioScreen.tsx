import React, { useCallback, useState } from "react";
import { View, Text } from "react-native";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { useFocusEffect } from "@react-navigation/native";
import { getDb } from "@/data/db";
import { Lock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ScenarioRecord = {
  id: number;
  titre: string;
  level: number;
};

export default function SelectScenarioScreen() {
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
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
            "SELECT id, titre, level FROM scenarios ORDER BY titre ASC",
          )) as ScenarioRecord[];
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
              onPress={() => {}}
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

