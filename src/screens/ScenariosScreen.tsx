import React, { useCallback, useState } from "react";
import { View, Text, Image, Modal, TouchableOpacity } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { LogIn, PlusCircle } from "lucide-react-native";

type ScenariosScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Scenarios"
>;

export default function ScenariosScreen() {
  const navigation = useNavigation<ScenariosScreenNavigationProp>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showImage, setShowImage] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const stored = await SecureStore.getItemAsync("user");
        setIsLoggedIn(!!stored);
      };
      loadUser();
    }, [])
  );

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        {!isLoggedIn ? (
          <>
            <Text className="text-white text-center">
              Connectez-vous afin de rejoindre ou de créer une nouvelle partie.
            </Text>
            <TouchableOpacity onPress={() => setShowImage(true)}>
              <Image
                source={require("../../assets/illustrations/joinus.jpg")}
                className="mt-4 w-full h-64"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Modal
              visible={showImage}
              transparent
              animationType="fade"
              onRequestClose={() => setShowImage(false)}
            >
              <TouchableOpacity
                className="flex-1 bg-black"
                onPress={() => setShowImage(false)}
              >
                <Image
                  source={require("../../assets/illustrations/joinus.jpg")}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </Modal>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              size="md"
              className="mb-4"
              onPress={() => {}}
            >
              <View className="flex-row items-center">
                <LogIn color="#fff" size={16} />
                <Text className="text-white ml-2">
                  Rejoindre une partie en tant que joueur
                </Text>
              </View>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onPress={() => navigation.navigate("SelectScenario")}
            >
              <View className="flex-row items-center">
                <PlusCircle color="#fff" size={16} />
                <Text className="text-white ml-2">
                  Créer une partie en tant que MJ
                </Text>
              </View>
            </Button>
          </>
        )}
      </View>
    </Layout>
  );
}

