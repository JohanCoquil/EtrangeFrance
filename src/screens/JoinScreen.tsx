import React, { useState } from "react";
import { View, TextInput, Image, TouchableOpacity, Modal } from "react-native";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";

export default function JoinScreen() {
  const [gameId, setGameId] = useState("");
  const [showImage, setShowImage] = useState(false);

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        <TextInput
          value={gameId}
          onChangeText={setGameId}
          placeholder="Identifiant de partie"
          placeholderTextColor="#9ca3af"
          className="bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4"
        />
        <Button variant="primary" size="md" onPress={() => {}}>
          Rejoindre
        </Button>
        <TouchableOpacity onPress={() => setShowImage(true)} className="mt-4">
          <Image
            source={require("../../assets/illustrations/car.jpg")}
            className="w-full h-64"
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
              source={require("../../assets/illustrations/car.jpg")}
              className="w-full h-full"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
      </View>
    </Layout>
  );
}
