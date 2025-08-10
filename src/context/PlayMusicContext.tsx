// src/context/PlayMusicContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';

type PlayMusicContextType = {
  playMusic: boolean;
  setPlayMusic: (value: boolean) => void;
};

const PlayMusicContext = createContext<PlayMusicContextType | undefined>(undefined);

export const PlayMusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playMusic, setPlayMusic] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    const setup = async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        interruptionModeAndroid: 'duckOthers',
        shouldPlayInBackground: true,
      });
      const player = createAudioPlayer(require('../../sounds/13-Enigmatic-Shadows.mp3'));
      player.loop = true;
      playerRef.current = player;
      if (playMusic) {
        player.play();
      }
    };
    setup();
    return () => {
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (playMusic) {
      if (!player.playing) {
        player.play();
      }
    } else {
      if (player.playing) {
        player.pause();
      }
    }
  }, [playMusic]);

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
