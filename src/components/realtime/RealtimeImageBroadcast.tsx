import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import type { Message } from 'ably';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';

import { useAblyChannel } from '@/hooks/useAblyChannel';
import type { ImageBroadcast, ImageBroadcastPayload, RealtimeIdentity } from '@/types/realtime';

const IMAGE_EVENT = 'image-broadcast';

interface RealtimeImageBroadcastProps {
  channelName: string;
  currentUser: RealtimeIdentity;
  isGameMaster: boolean;
  historyLimit?: number;
  emptyStateText?: string;
}

const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
};

const toImageBroadcast = (message: Message): ImageBroadcast | null => {
  if (message.name && message.name !== IMAGE_EVENT) {
    return null;
  }

  const data = message.data as Partial<ImageBroadcastPayload> | null | undefined;

  if (!data) {
    return null;
  }

  const fallbackId =
    data.id ??
    message.id ??
    (message.timestamp ? `${message.timestamp}-${message.connectionId ?? 'local'}` : undefined) ??
    uuidv4();

  return {
    id: fallbackId,
    senderId: data.senderId ?? message.clientId ?? 'unknown',
    senderName: data.senderName ?? data.senderId ?? message.clientId ?? 'Anonyme',
    imageUrl: data.imageUrl,
    base64: data.base64,
    mimeType: data.mimeType,
    caption: data.caption,
    timestamp: message.timestamp ?? Date.now(),
  };
};

const toImageSource = (broadcast: ImageBroadcast) => {
  if (broadcast.imageUrl) {
    return { uri: broadcast.imageUrl } as const;
  }

  if (broadcast.base64) {
    const mimeType = broadcast.mimeType ?? 'image/jpeg';
    return { uri: `data:${mimeType};base64,${broadcast.base64}` } as const;
  }

  return undefined;
};

export default function RealtimeImageBroadcast({
  channelName,
  currentUser,
  isGameMaster,
  historyLimit = 10,
  emptyStateText = "Aucune image n'a encore été partagée.",
}: RealtimeImageBroadcastProps) {
  const [broadcasts, setBroadcasts] = useState<ImageBroadcast[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleIncoming = useCallback((message: Message) => {
    const parsed = toImageBroadcast(message);
    if (!parsed) {
      return;
    }

    setBroadcasts((previous) => {
      const existingIndex = previous.findIndex((item) => item.id === parsed.id);
      const nextItems = existingIndex >= 0 ? [...previous] : [...previous, parsed];

      if (existingIndex >= 0) {
        nextItems[existingIndex] = parsed;
      }

      nextItems.sort((a, b) => a.timestamp - b.timestamp);

      if (nextItems.length > historyLimit) {
        return nextItems.slice(-historyLimit);
      }

      return nextItems;
    });
  }, [historyLimit]);

  const { channel, publish, fetchHistory } = useAblyChannel(channelName, {
    events: IMAGE_EVENT,
    onMessage: handleIncoming,
  });

  useEffect(() => {
    if (!channel) {
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      try {
        const page = await fetchHistory({ limit: historyLimit });
        if (!page || !isMounted) {
          return;
        }

        const history = page.items
          .map((item) => toImageBroadcast(item))
          .filter((item): item is ImageBroadcast => Boolean(item))
          .sort((a, b) => a.timestamp - b.timestamp);

        setBroadcasts(history.slice(-historyLimit));
      } catch (error) {
        console.warn('Unable to fetch image broadcast history from Ably', error);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [channel, fetchHistory, historyLimit]);

  const broadcastImage = useCallback(
    async (content: Pick<ImageBroadcastPayload, 'imageUrl' | 'base64' | 'mimeType'>) => {
      if (isBroadcasting) {
        return;
      }

      if (!content.imageUrl && !content.base64) {
        Alert.alert('Image manquante', 'Sélectionne un fichier ou fournis une URL avant de diffuser.');
        return;
      }

      setIsBroadcasting(true);

      const payload: ImageBroadcastPayload = {
        id: uuidv4(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        caption: caption.trim() || undefined,
        ...content,
      };

      try {
        await publish(IMAGE_EVENT, payload);
        setCaption('');
        setImageUrl('');
      } catch (error) {
        console.warn('Unable to broadcast image via Ably', error);
      } finally {
        setIsBroadcasting(false);
      }
    },
    [caption, currentUser.id, currentUser.name, isBroadcasting, publish],
  );

  const handleBroadcastUrl = useCallback(() => {
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      Alert.alert('URL manquante', 'Renseigne une URL publique avant de diffuser.');
      return;
    }

    broadcastImage({ imageUrl: trimmed });
  }, [broadcastImage, imageUrl]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "L'application a besoin de l'accès à ta galerie pour diffuser une image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];

    if (!asset.base64) {
      Alert.alert(
        'Conversion impossible',
        "Impossible de récupérer les données de l'image sélectionnée. Réessaie avec un autre fichier.",
      );
      return;
    }

    if (asset.base64.length > 60000) {
      Alert.alert(
        'Image volumineuse',
        "L'image encodée dépasse la taille recommandée pour Ably (≈60 Ko). Réduis sa taille avant de la diffuser.",
      );
      return;
    }

    broadcastImage({
      base64: asset.base64,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  }, [broadcastImage]);

  const latestBroadcast = useMemo(
    () => (broadcasts.length ? broadcasts[broadcasts.length - 1] : null),
    [broadcasts],
  );

  const history = useMemo(
    () => (broadcasts.length > 1 ? broadcasts.slice(0, -1).reverse() : []),
    [broadcasts],
  );

  const renderImage = useCallback(
    (broadcast: ImageBroadcast, variant: 'large' | 'thumbnail') => {
      const source = toImageSource(broadcast);

      if (!source) {
        return (
          <View style={[styles.imageFallback, variant === 'large' ? styles.imageLarge : styles.imageThumbnail]}>
            <Text style={styles.imageFallbackText}>Image indisponible</Text>
          </View>
        );
      }

      return (
        <Image
          source={source}
          style={variant === 'large' ? styles.imageLarge : styles.imageThumbnail}
          resizeMode="cover"
        />
      );
    },
    [],
  );

  return (
    <View style={styles.container}>
      {latestBroadcast ? (
        <View style={styles.currentBroadcast}>
          {renderImage(latestBroadcast, 'large')}
          <View style={styles.captionContainer}>
            <Text style={styles.captionTitle}>{latestBroadcast.senderName}</Text>
            {latestBroadcast.caption ? (
              <Text style={styles.captionText}>{latestBroadcast.caption}</Text>
            ) : null}
            <Text style={styles.captionTimestamp}>{formatDateTime(latestBroadcast.timestamp)}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyBroadcast}>
          <Text style={styles.emptyBroadcastText}>{emptyStateText}</Text>
        </View>
      )}

      {isGameMaster ? (
        <View style={styles.controls}>
          <Text style={styles.controlsTitle}>Diffuser une image</Text>
          <TextInput
            style={styles.input}
            placeholder="URL de l'image (https://…)"
            value={imageUrl}
            onChangeText={setImageUrl}
            editable={!isBroadcasting}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Légende (optionnelle)"
            value={caption}
            onChangeText={setCaption}
            editable={!isBroadcasting}
          />
          <View style={styles.controlsButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && !isBroadcasting ? styles.actionButtonPressed : null,
                (isBroadcasting || !imageUrl.trim()) && styles.actionButtonDisabled,
              ]}
              accessibilityRole="button"
              onPress={handleBroadcastUrl}
              disabled={isBroadcasting || !imageUrl.trim()}
            >
              <Text style={styles.actionButtonLabel}>Diffuser l'URL</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && !isBroadcasting ? styles.actionButtonPressed : null,
                isBroadcasting && styles.actionButtonDisabled,
              ]}
              accessibilityRole="button"
              onPress={handlePickImage}
              disabled={isBroadcasting}
            >
              <Text style={styles.actionButtonLabel}>Choisir dans la galerie</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {history.length ? (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Historique des diffusions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
            {history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                {renderImage(item, 'thumbnail')}
                <Text numberOfLines={1} style={styles.historyCaption}>
                  {item.caption ?? 'Sans légende'}
                </Text>
                <Text style={styles.historyMeta}>{formatDateTime(item.timestamp)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    gap: 16,
  },
  currentBroadcast: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  emptyBroadcast: {
    padding: 32,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBroadcastText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  imageLarge: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e5e7eb',
  },
  imageThumbnail: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  imageFallbackText: {
    color: '#4b5563',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  captionContainer: {
    padding: 12,
    gap: 4,
  },
  captionTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  captionText: {
    color: '#111827',
  },
  captionTimestamp: {
    fontSize: 12,
    color: '#4b5563',
  },
  controls: {
    gap: 12,
  },
  controlsTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#111827',
  },
  controlsButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
  },
  actionButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonLabel: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  historyContainer: {
    gap: 8,
  },
  historyTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    width: 120,
    gap: 4,
  },
  historyCaption: {
    color: '#111827',
  },
  historyMeta: {
    fontSize: 12,
    color: '#4b5563',
  },
});
