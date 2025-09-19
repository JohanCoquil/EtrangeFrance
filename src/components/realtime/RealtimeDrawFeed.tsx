import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ListRenderItem } from 'react-native';
import type { Message } from 'ably';
import { v4 as uuidv4 } from 'uuid';

import { useAblyChannel } from '@/hooks/useAblyChannel';
import type { DrawResult, DrawResultPayload, RealtimeIdentity } from '@/types/realtime';

const DRAW_EVENT = 'draw-result';
const DEFAULT_DICE = [4, 6, 8, 10, 12, 20, 100];

interface RealtimeDrawFeedProps {
  channelName: string;
  currentUser: RealtimeIdentity;
  historyLimit?: number;
  diceOptions?: number[];
  emptyStateText?: string;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}h${minutes}`;
};

const parseDrawResult = (message: Message): DrawResult | null => {
  if (message.name && message.name !== DRAW_EVENT) {
    return null;
  }

  const data = message.data as Partial<DrawResultPayload> | null | undefined;

  if (!data) {
    return null;
  }

  const rolls = Array.isArray(data.rolls)
    ? data.rolls.filter((value): value is number => typeof value === 'number')
    : [];

  const fallbackId =
    data.id ??
    message.id ??
    (message.timestamp ? `${message.timestamp}-${message.connectionId ?? 'local'}` : undefined) ??
    uuidv4();

  const modifier = typeof data.modifier === 'number' ? data.modifier : undefined;
  const total =
    typeof data.total === 'number'
      ? data.total
      : rolls.reduce((sum, value) => sum + value, 0) + (modifier ?? 0);

  return {
    id: fallbackId,
    actorId: data.actorId ?? message.clientId ?? 'unknown',
    actorName: data.actorName ?? data.actorId ?? message.clientId ?? 'Anonyme',
    label: data.label ?? 'Jet',
    diceSize: data.diceSize ?? 20,
    rolls: rolls.length ? rolls : [0],
    modifier,
    total,
    timestamp: message.timestamp ?? Date.now(),
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function RealtimeDrawFeed({
  channelName,
  currentUser,
  historyLimit = 50,
  diceOptions = DEFAULT_DICE,
  emptyStateText = 'Aucun tirage partagé pour le moment.',
}: RealtimeDrawFeedProps) {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [selectedDie, setSelectedDie] = useState(() => diceOptions[0] ?? 20);
  const [diceCount, setDiceCount] = useState('1');
  const [modifier, setModifier] = useState('0');
  const [label, setLabel] = useState('');
  const [isRolling, setIsRolling] = useState(false);

  const handleIncoming = useCallback((message: Message) => {
    const parsed = parseDrawResult(message);
    if (!parsed) {
      return;
    }

    setDraws((previous) => {
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
    events: DRAW_EVENT,
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
          .map((item) => parseDrawResult(item))
          .filter((item): item is DrawResult => Boolean(item))
          .sort((a, b) => a.timestamp - b.timestamp);

        setDraws(history.slice(-historyLimit));
      } catch (error) {
        console.warn('Unable to fetch draw history from Ably', error);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [channel, fetchHistory, historyLimit]);

  const rollDice = useCallback(
    () => {
      if (isRolling) {
        return;
      }

      const parsedCount = clamp(parseInt(diceCount, 10) || 1, 1, 10);
      const parsedModifier = Number(modifier) || 0;

      setIsRolling(true);

      const rolls = Array.from({ length: parsedCount }, () =>
        Math.floor(Math.random() * Math.max(selectedDie, 1)) + 1,
      );

      const total = rolls.reduce((sum, value) => sum + value, 0) + parsedModifier;

      const payload: DrawResultPayload = {
        id: uuidv4(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        label: label.trim() || `Jet de d${selectedDie}`,
        diceSize: selectedDie,
        rolls,
        modifier: parsedModifier || undefined,
        total,
      };

      publish(DRAW_EVENT, payload)
        .catch((error) => {
          console.warn('Unable to publish draw result via Ably', error);
        })
        .finally(() => {
          setIsRolling(false);
          setLabel('');
        });
    },
    [currentUser.id, currentUser.name, diceCount, isRolling, label, modifier, publish, selectedDie],
  );

  useEffect(() => {
    if (!diceOptions.includes(selectedDie) && diceOptions.length) {
      setSelectedDie(diceOptions[0]);
    }
  }, [diceOptions, selectedDie]);

  const renderItem = useCallback<ListRenderItem<DrawResult>>(
    ({ item }) => {
      const isOwn = item.actorId === currentUser.id;
      const modifierLabel =
        typeof item.modifier === 'number' && item.modifier !== 0
          ? `${item.modifier > 0 ? '+' : '-'} ${Math.abs(item.modifier)}`
          : null;

      return (
        <View
          style={[
            styles.drawCard,
            isOwn ? styles.drawCardSelf : styles.drawCardOther,
          ]}
        >
          <Text style={styles.drawLabel}>{item.label}</Text>
          <Text style={styles.drawMeta}>
            {item.actorName} • {item.rolls.length}d{item.diceSize}
            {modifierLabel ? ` ${modifierLabel}` : ''}
          </Text>
          <Text style={styles.drawTotal}>Résultat : {item.total}</Text>
          <Text style={styles.drawDetails}>
            Jets : {item.rolls.join(' + ')}
            {modifierLabel ? ` ${modifierLabel}` : ''}
          </Text>
          <Text style={styles.drawTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      );
    },
    [currentUser.id],
  );

  const keyExtractor = useCallback((item: DrawResult) => item.id, []);

  const listData = useMemo(() => draws.slice().reverse(), [draws]);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.controlsTitle}>Partager un tirage</Text>
        <View style={styles.diceOptionsRow}>
          {diceOptions.map((faces) => {
            const isSelected = faces === selectedDie;
            return (
              <Pressable
                key={faces}
                onPress={() => setSelectedDie(faces)}
                style={({ pressed }) => [
                  styles.diceOption,
                  isSelected && styles.diceOptionSelected,
                  pressed && isSelected ? styles.diceOptionPressed : null,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.diceOptionLabel,
                    isSelected && styles.diceOptionLabelSelected,
                  ]}
                >
                  d{faces}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de dés</Text>
            <TextInput
              style={styles.input}
              value={diceCount}
              onChangeText={setDiceCount}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Modificateur</Text>
            <TextInput
              style={styles.input}
              value={modifier}
              onChangeText={setModifier}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Intitulé du tirage (optionnel)"
          value={label}
          onChangeText={setLabel}
        />
        <Pressable
          style={({ pressed }) => [
            styles.rollButton,
            pressed && !isRolling ? styles.rollButtonPressed : null,
            isRolling && styles.rollButtonDisabled,
          ]}
          onPress={rollDice}
          disabled={isRolling}
        >
          <Text style={styles.rollButtonLabel}>{isRolling ? 'Envoi…' : 'Lancer'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={listData.length ? styles.listContent : styles.listEmpty}
        ListEmptyComponent={<Text style={styles.emptyState}>{emptyStateText}</Text>}
      />
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
  controls: {
    gap: 12,
  },
  controlsTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  diceOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diceOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  diceOptionSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  diceOptionPressed: {
    opacity: 0.85,
  },
  diceOptionLabel: {
    color: '#111827',
    fontWeight: '600',
  },
  diceOptionLabelSelected: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#4b5563',
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
  rollButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
  },
  rollButtonPressed: {
    opacity: 0.85,
  },
  rollButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  rollButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    gap: 12,
  },
  listEmpty: {
    paddingVertical: 24,
  },
  emptyState: {
    textAlign: 'center',
    color: '#6b7280',
  },
  drawCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    gap: 6,
  },
  drawCardSelf: {
    backgroundColor: '#a5b4fc',
  },
  drawCardOther: {
    backgroundColor: '#e5e7eb',
  },
  drawLabel: {
    fontWeight: '600',
    color: '#111827',
  },
  drawMeta: {
    color: '#111827',
  },
  drawTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  drawDetails: {
    color: '#111827',
  },
  drawTimestamp: {
    fontSize: 12,
    color: '#4b5563',
  },
});
