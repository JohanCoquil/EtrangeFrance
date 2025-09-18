import React, { useState, useEffect } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import Layout from "@/components/ui/Layout";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/utils/api";

export default function JoinScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || joining) return;

    setScanned(true);
    setJoining(true);

    try {
      console.log("QR Code scanné:", data);

      // Vérifier que c'est bien un UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data)) {
        Alert.alert(
          "QR Code invalide",
          "Ce QR Code ne contient pas un identifiant de partie valide."
        );
        return;
      }

      // Vérifier l'existence de la partie
      const partiesResponse = await apiFetch(
        `https://api.scriptonautes.net/api/records/parties?filter=qr_code,eq,${encodeURIComponent(data)}`
      );

      if (!partiesResponse.ok) {
        throw new Error("Impossible de vérifier l'existence de la partie.");
      }

      const partiesText = await partiesResponse.text();
      const partiesData = JSON.parse(partiesText);

      if (!partiesData.records || partiesData.records.length === 0) {
        Alert.alert(
          "Partie introuvable",
          "Aucune partie active n'a été trouvée avec ce QR Code."
        );
        return;
      }

      const party = partiesData.records[0];
      console.log("Partie trouvée:", party);

      // Récupérer l'utilisateur connecté
      const storedUser = await SecureStore.getItemAsync("user");
      if (!storedUser) {
        Alert.alert(
          "Non connecté",
          "Vous devez être connecté pour rejoindre une partie."
        );
        return;
      }

      let parsedUser: any = null;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (parseError) {
        console.error("Unable to parse stored user", parseError);
        Alert.alert(
          "Erreur",
          "Impossible de récupérer vos informations utilisateur."
        );
        return;
      }

      const userId = Number(parsedUser?.id);
      if (!Number.isFinite(userId)) {
        Alert.alert("Erreur", "Identifiant utilisateur invalide.");
        return;
      }

      // Rejoindre la partie
      const joinResponse = await apiFetch(
        "https://api.scriptonautes.net/api/records/participants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partie_id: party.id,
            user_id: userId,
          }),
        }
      );

      if (!joinResponse.ok) {
        const errorText = await joinResponse.text();
        throw new Error(errorText || "Impossible de rejoindre la partie.");
      }

      Alert.alert(
        "Partie rejointe !",
        `Vous avez rejoint la partie avec succès !`,
        [
          {
            text: "OK",
            onPress: () => {
              // Optionnel : naviguer vers une autre écran ou recharger
              setScanned(false);
            },
          },
        ]
      );

    } catch (error) {
      console.error("Erreur lors de la jonction:", error);
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de rejoindre la partie pour le moment."
      );
    } finally {
      setJoining(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setJoining(false);
  };

  if (!permission) {
    return (
      <Layout backgroundColor="gradient" variant="scroll">
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white mt-4">Chargement des permissions...</Text>
        </View>
      </Layout>
    );
  }

  if (!permission.granted) {
    return (
      <Layout backgroundColor="gradient" variant="scroll">
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-white text-center text-lg mb-4">
            Accès à la caméra requis
          </Text>
          <Text className="text-white/80 text-center mb-6">
            L'accès à la caméra est nécessaire pour scanner les QR codes des parties.
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={requestPermission}
          >
            Autoriser la caméra
          </Button>
        </View>
      </Layout>
    );
  }

  return (
    <Layout backgroundColor="gradient" variant="scroll">
      <View className="flex-1 p-4">
        <Text className="text-white text-2xl font-bold text-center mb-6">
          Rejoindre une partie
        </Text>

        <Text className="text-white/80 text-center mb-6">
          Scannez le QR code de la partie pour la rejoindre automatiquement
        </Text>

        <View className="flex-1 bg-black rounded-xl overflow-hidden mb-4">
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            style={{ flex: 1 }}
          />

          {joining && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-white mt-4 text-center">
                Rejoindre la partie...
              </Text>
            </View>
          )}
        </View>

        {scanned && (
          <View className="mb-4">
            <Text className="text-white/80 text-center mb-4">
              QR Code scanné ! Traitement en cours...
            </Text>
            <Button
              variant="secondary"
              size="md"
              onPress={resetScanner}
            >
              Scanner un autre QR Code
            </Button>
          </View>
        )}

        <Text className="text-white/60 text-center text-sm">
          Positionnez le QR code dans le cadre pour le scanner
        </Text>
      </View>
    </Layout>
  );
}