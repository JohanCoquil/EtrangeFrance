import React from "react";
import { View } from "react-native";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";

export default function SelectScenarioScreen() {
  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        <Button variant="primary" size="md" className="mb-4" onPress={() => {}}>
          L'affaire De La Main Verte
        </Button>
        <Button variant="secondary" size="md" onPress={() => {}}>
          Créer mon scénario
        </Button>
      </View>
    </Layout>
  );
}

