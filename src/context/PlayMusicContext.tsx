// src/context/PlayMusicContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PlayMusicContextType = {
  playMusic: boolean;
  setPlayMusic: (value: boolean) => void;
  musicEnabled: boolean;
  setMusicEnabled: (value: boolean) => void;
};

const PlayMusicContext = createContext<PlayMusicContextType | undefined>(
  undefined,
);

export const PlayMusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playMusic, setPlayMusic] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const playerRef = useRef<Audio.Sound | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const setup = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require("../../sounds/13-Enigmatic-Shadows.mp3"),
        { isLooping: true },
      );
      playerRef.current = sound;
      setPlayerReady(true);
    };
    setup();
    return () => {
      playerRef.current?.unloadAsync();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadSetting = async () => {
      const stored = await AsyncStorage.getItem("musicEnabled");
      if (stored !== null) {
        setMusicEnabled(stored === "true");
      }
    };
    loadSetting();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("musicEnabled", musicEnabled ? "true" : "false");
  }, [musicEnabled]);

  useEffect(() => {
    const player = playerRef.current;
    if (!playerReady || !player) return;
    if (playMusic && musicEnabled && appState.current === "active") {
      player.playAsync();
    } else {
      player.pauseAsync();
    }
  }, [playMusic, playerReady, musicEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        playerRef.current?.pauseAsync();
      } else if (
        nextAppState === "active" &&
        playMusic &&
        playerReady &&
        musicEnabled
      ) {
        playerRef.current?.playAsync();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, [playMusic, playerReady, musicEnabled]);

  return (
    <PlayMusicContext.Provider
      value={{ playMusic, setPlayMusic, musicEnabled, setMusicEnabled }}
    >
      {children}
    </PlayMusicContext.Provider>
  );
};

export const usePlayMusic = () => {
  const ctx = useContext(PlayMusicContext);
  if (!ctx) {
    throw new Error("usePlayMusic must be used within a PlayMusicProvider");
  }
  return ctx;
};
