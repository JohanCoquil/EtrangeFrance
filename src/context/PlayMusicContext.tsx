// src/context/PlayMusicContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';

type PlayMusicContextType = {
  playMusic: boolean;
  setPlayMusic: (value: boolean) => void;
};

const PlayMusicContext = createContext<PlayMusicContextType | undefined>(undefined);

export const PlayMusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playMusic, setPlayMusic] = useState(false);
  const playerRef = useRef<Audio.Sound | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('../../sounds/13-Enigmatic-Shadows.mp3'),
        { isLooping: true }
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
    const player = playerRef.current;
    if (!playerReady || !player) return;
    if (playMusic) {
      player.playAsync();
    } else {
      player.pauseAsync();
    }
  }, [playMusic, playerReady]);

  return (
    <PlayMusicContext.Provider value={{ playMusic, setPlayMusic }}>
      {children}
    </PlayMusicContext.Provider>
  );
};

export const usePlayMusic = () => {
  const ctx = useContext(PlayMusicContext);
  if (!ctx) {
    throw new Error('usePlayMusic must be used within a PlayMusicProvider');
  }
  return ctx;
};
