import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import type { ListRenderItem } from 'react-native';
import type { Message } from 'ably';
import { v4 as uuidv4 } from 'uuid';

import { useAblyChannel } from '@/hooks/useAblyChannel';
import type { ChatMessage, ChatMessagePayload, RealtimeIdentity } from '@/types/realtime';

const CHAT_EVENT = 'chat-message';

interface RealtimeChatProps {
  channelName: string;
  currentUser: RealtimeIdentity;
  /** Maximum number of chat messages kept in memory. */
  messageLimit?: number;
  placeholder?: string;
  emptyStateText?: string;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const parseChatMessage = (message: Message): ChatMessage | null => {
  if (message.name && message.name !== CHAT_EVENT) {
    return null;
  }

  const rawData = message.data as Partial<ChatMessagePayload> | string | null | undefined;

  let payload: Partial<ChatMessagePayload> | null = null;

  if (typeof rawData === 'string') {
    payload = { text: rawData };
  } else if (rawData && typeof rawData === 'object') {
    payload = rawData;
  }

  if (!payload?.text) {
    return null;
  }

  const fallbackId =
    payload.id ??
    message.id ??
    (message.timestamp ? `${message.timestamp}-${message.connectionId ?? 'local'}` : undefined) ??
    uuidv4();

  return {
    id: fallbackId,
    text: payload.text,
    senderId: payload.senderId ?? message.clientId ?? 'unknown',
    senderName: payload.senderName ?? payload.senderId ?? message.clientId ?? 'Anonyme',
    timestamp: message.timestamp ?? Date.now(),
  };
};

export default function RealtimeChat({
  channelName,
  currentUser,
  messageLimit = 100,
  placeholder = 'Écrire un message…',
  emptyStateText = 'Aucun message pour le moment.',
}: RealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleIncomingMessage = useCallback(
    (message: Message) => {
      const parsed = parseChatMessage(message);
      if (!parsed) {
        return;
      }

      setMessages((previous) => {
        const existingIndex = previous.findIndex((item) => item.id === parsed.id);
        const nextMessages = existingIndex >= 0 ? [...previous] : [...previous, parsed];

        if (existingIndex >= 0) {
          nextMessages[existingIndex] = parsed;
        }

        nextMessages.sort((a, b) => a.timestamp - b.timestamp);

        if (nextMessages.length > messageLimit) {
          return nextMessages.slice(-messageLimit);
        }

        return nextMessages;
      });
    },
    [messageLimit],
  );

  const { channel, publish, fetchHistory } = useAblyChannel(channelName, {
    events: CHAT_EVENT,
    onMessage: handleIncomingMessage,
  });

  useEffect(() => {
    if (!channel) {
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      try {
        const page = await fetchHistory({ limit: messageLimit });
        if (!page || !isMounted) {
          return;
        }

        const history = page.items
          .map((item) => parseChatMessage(item))
          .filter((item): item is ChatMessage => Boolean(item))
          .sort((a, b) => a.timestamp - b.timestamp);

        setMessages(history.slice(-messageLimit));
      } catch (error) {
        console.warn('Unable to fetch chat history from Ably', error);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [channel, fetchHistory, messageLimit]);

  const sendMessage = useCallback(async () => {
    const trimmed = draft.trim();

    if (!trimmed || isSending) {
      return;
    }

    setIsSending(true);

    const payload: ChatMessagePayload = {
      id: uuidv4(),
      text: trimmed,
      senderId: currentUser.id,
      senderName: currentUser.name,
    };

    try {
      await publish(CHAT_EVENT, payload);
      setDraft('');
    } catch (error) {
      console.warn('Unable to publish chat message to Ably', error);
    } finally {
      setIsSending(false);
    }
  }, [currentUser.id, currentUser.name, draft, isSending, publish]);

  const renderItem = useCallback<ListRenderItem<ChatMessage>>(
    ({ item }) => {
      const isOwnMessage = item.senderId === currentUser.id;

      return (
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.messageBubbleSelf : styles.messageBubbleOther,
          ]}
        >
          <Text style={styles.messageSender}>{item.senderName}</Text>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      );
    },
    [currentUser.id],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const listData = useMemo(() => messages, [messages]);

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={listData.length ? styles.listContent : styles.listEmpty}
        ListEmptyComponent={<Text style={styles.emptyState}>{emptyStateText}</Text>}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          multiline
          autoCorrect
          onSubmitEditing={sendMessage}
          editable={!isSending}
        />
        <Pressable
          accessibilityRole="button"
          onPress={sendMessage}
          disabled={!draft.trim() || isSending}
          style={({ pressed }) => [
            styles.sendButton,
            (!draft.trim() || isSending) && styles.sendButtonDisabled,
            pressed && !isSending ? styles.sendButtonPressed : null,
          ]}
        >
          <Text style={styles.sendButtonLabel}>Envoyer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  listEmpty: {
    padding: 24,
  },
  emptyState: {
    textAlign: 'center',
    color: '#6b7280',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  messageBubbleSelf: {
    backgroundColor: '#a5b4fc',
    alignSelf: 'flex-end',
  },
  messageBubbleOther: {
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  messageText: {
    color: '#111827',
  },
  messageTimestamp: {
    marginTop: 4,
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    gap: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
  },
  sendButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  sendButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});
