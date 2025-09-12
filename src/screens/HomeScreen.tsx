import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Dimensions,
  ImageBackground,
  Animated,
  Modal,
  ActivityIndicator,
  Text,
  Linking,
} from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Audio, Video, ResizeMode } from "expo-av";
import { TabParamList, RootStackParamList } from "../navigation/types";
import { Button, Title, Body, Caption } from "../components/ui";
import { syncDatabase } from "@/data/sync";
import { usePlayMusic } from "@/context/PlayMusicContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = BottomTabScreenProps<TabParamList, "Home"> & {
  user: { id: number; login: string } | null;
};

const backgrounds = [
  require("../../assets/illustrations/background.jpg"),
  require("../../assets/illustrations/background2.jpg"),
  require("../../assets/illustrations/background3.jpg"),
  require("../../assets/illustrations/background4.jpg"),
];

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

let hasSyncedOnce = false;

export default function HomeScreen({ navigation, user }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [initModal, setInitModal] = useState(!hasSyncedOnce);
  const [syncing, setSyncing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [minitelLoaded, setMinitelLoaded] = useState(false);
  const [introSkipped, setIntroSkipped] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const minitelPlayer = useRef<Audio.Sound | null>(null);
  const videoRef = useRef<Video>(null);

  const { setPlayMusic } = usePlayMusic();

  const handleEnterAgency = () => {
    rootNavigation.navigate("Auth");
  };

  useEffect(() => {
    const loadIntroFlag = async () => {
      const stored = await AsyncStorage.getItem("introSkipped");
      if (stored === "true") {
        setIntroSkipped(true);
        setInitModal(false);
        setPlayMusic(true);
        setSyncing(true);
        try {
          await syncDatabase();
        } catch (e) {
          console.error("Database sync failed", e);
        }
        setSyncing(false);
        hasSyncedOnce = true;
      }
    };
    loadIntroFlag();
  }, [setPlayMusic]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      fadeAnim.setValue(0);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        setNextIndex((nextIndex + 1) % backgrounds.length);
        setIsTransitioning(false);
      });
    }, 7000); // changement toutes les 7 secondes

    return () => clearInterval(interval);
  }, [nextIndex]);

  useEffect(() => {
    const setup = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../../sounds/minitel.mp3"),
      );
      minitelPlayer.current = sound;
      setMinitelLoaded(true);
    };
    setup();
    return () => {
      minitelPlayer.current?.unloadAsync();
      minitelPlayer.current = null;
    };
  }, []);

  useEffect(() => {
    const loadVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.loadAsync(require("../../assets/minitel.mp4"), {
          isLooping: true,
          shouldPlay: false,
        });
      }
    };
    loadVideo();
    return () => {
      videoRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (!initModal || !minitelLoaded || introSkipped) return;
    const run = async () => {
      setPlayMusic(false);
      await minitelPlayer.current?.setPositionAsync(0);
      await minitelPlayer.current?.playAsync();
      await new Promise((res) => setTimeout(res, 12000));
      await minitelPlayer.current?.stopAsync();
      if (introSkipped) return;
      setShowAnimation(true);
      setPlayMusic(true);
      setSyncing(true);
      try {
        await syncDatabase();
      } catch (e) {
        console.error("Database sync failed", e);
      }
      await new Promise((res) => setTimeout(res, 5000));
      setSyncing(false);
      setInitModal(false);
      hasSyncedOnce = true;
    };
    run();
  }, [initModal, setPlayMusic, minitelLoaded, introSkipped]);

  const handleSkipIntro = async () => {
    await minitelPlayer.current?.stopAsync();
    setIntroSkipped(true);
    setInitModal(false);
    setPlayMusic(true);
    setSyncing(true);
    try {
      await syncDatabase();
    } catch (e) {
      console.error("Database sync failed", e);
    }
    setSyncing(false);
    await AsyncStorage.setItem("introSkipped", "true");
    hasSyncedOnce = true;
  };

  const handleResetIntro = async () => {
    await AsyncStorage.setItem("introSkipped", "false");
    setIntroSkipped(false);
  };

  useEffect(() => {
    if (showAnimation) {
      videoRef.current?.replayAsync();
    }
  }, [showAnimation]);

  const ScreenContent = () => (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "flex-start",
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
        minHeight: screenHeight,
      }}
    >
      <View className="mb-8">
        <Title className="text-white text-center text-4xl font-bold mb-2 tracking-wider">
          ÉTRANGE
        </Title>
        <Title className="text-white text-center text-5xl font-bold tracking-widest">
          FRANCE
        </Title>
        <Caption className="text-white text-center mt-2 tracking-widest uppercase">
          Agences d'Enquêtes Occultes
        </Caption>
      </View>

      <View className="bg-black/40 rounded-lg p-6 mb-8 border border-blue-500/30">
        <Body className="text-white text-center leading-relaxed mb-4">
          Etrange France se déroule dans un monde reflet du notre, où le
          surnaturel existe. Les mages, les fées, les mythes, les dieux anciens
          le parcourent depuis toujours.
        </Body>
        <Body className="text-white text-center leading-relaxed mb-4">
          Nous sommes en 1989. La semaine passée, le mur de Berlin est tombé ! À
          l'abris des regards, des agences de détectives privés surveillent,
          enquêtent et règlent les conflits du monde de l'étrange.
        </Body>
        <Caption className="text-white text-center italic">
          "1989. Le monde change; La technologie évolue; L'occulte reste dans
          l'ombre..."
        </Caption>
      </View>

      {!user && (
        <Button
          onPress={handleEnterAgency}
          variant="primary"
          className="w-full mb-6 py-4 bg-blue-700 border-2 border-blue-500"
        >
          <Title className="text-white text-lg font-semibold">
            🚪 Entrer dans l'Agence
          </Title>
        </Button>
      )}

      <View className="mt-8">
        <Caption className="text-white text-center">
          Assistant JDR Étrange France • Version 1.0.0
        </Caption>
        <Caption className="text-white text-center mt-1">
          Le jeu de rôles Étrange France est une création originale de{" "}
          <Text
            style={{ color: "#3b82f6", textDecorationLine: "underline" }}
            onPress={() => Linking.openURL("https://etrange-france.fr/")}
          >
            Fletch
          </Text>
          .
        </Caption>
      </View>
      {introSkipped && (
        <Button
          variant="secondary"
          className="w-full mt-4"
          onPress={handleResetIntro}
        >
          Remettre l'intro
        </Button>
      )}
    </ScrollView>
  );

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
        {/* Image actuelle */}
        <ImageBackground
          source={backgrounds[currentIndex]}
          resizeMode="cover"
          style={{
            position: "absolute",
            width: screenWidth,
            height: screenHeight,
          }}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.4)"]}
            style={{ flex: 1 }}
          />
        </ImageBackground>

        {/* Image de transition */}
        {isTransitioning && (
          <Animated.View
            style={{
              position: "absolute",
              width: screenWidth,
              height: screenHeight,
              opacity: fadeAnim,
            }}
          >
            <ImageBackground
              source={backgrounds[nextIndex]}
              resizeMode="cover"
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.1)",
                  "rgba(0,0,0,0.3)",
                  "rgba(0,0,0,0.4)",
                ]}
                style={{ flex: 1 }}
              />
            </ImageBackground>
          </Animated.View>
        )}

        {/* Contenu */}
        <ScreenContent />
      </View>
      <Modal
        visible={initModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <ImageBackground
          source={require("../../assets/illustrations/intro.png")}
          resizeMode="cover"
          style={{ flex: 1 }}
          blurRadius={0}
        >
          <View className="flex-1 items-center justify-center bg-black/60">
            <Video
              ref={videoRef}
              style={{
                width: screenWidth * 0.85,
                aspectRatio: 1,
                marginBottom: 16,
                opacity: showAnimation ? 1 : 0,
              }}
              resizeMode={ResizeMode.CONTAIN}
            />
            {syncing && (
              <>
                <ActivityIndicator size="large" color="#fff" />
                <Body className="text-white mt-4 text-center text-lg">
                  Récupération des dossiers de l'agence Khole en cours...
                </Body>
              </>
            )}
            <Text
              className="text-white mt-4 underline"
              onPress={handleSkipIntro}
            >
              Passer l'intro
            </Text>
          </View>
        </ImageBackground>
      </Modal>
    </>
  );
}
