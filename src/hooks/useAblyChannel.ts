import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Message,
  PresenceMessage,
  RealtimeChannel,
  ChannelOptions,
  ChannelStateChange,
} from 'ably';
import { useAblyClient } from '@/context/AblyProvider';

export interface UseAblyChannelOptions {
  /**
   * Forward channel configuration to Ably. Use `useMemo` when providing an object literal to avoid needless re-subscriptions.
   */
  channelOptions?: ChannelOptions;
  /**
   * Subscribe to one or multiple message events.
   */
  events?: string | string[];
  /**
   * Called whenever the channel receives a message for the subscribed events.
   */
  onMessage?: (message: Message) => void;
  /**
   * Called whenever a presence event is emitted by the channel.
   */
  onPresenceUpdate?: (presence: PresenceMessage) => void;
  /**
   * Fired for channel lifecycle updates.
   */
  onStateChange?: (change: ChannelStateChange) => void;
  /**
   * Avoids detaching the channel on unmount when set to true. Useful when several components share the same channel.
   */
  retainOnUnmount?: boolean;
  /**
   * Skip subscription logic when the component should not interact with the channel yet.
   */
  skip?: boolean;
}

const toArray = (input?: string | string[]) => {
  if (!input) {
    return undefined;
  }

  return Array.isArray(input) ? input : [input];
};

const detachChannel = (channel: RealtimeChannel) => {
  try {
    channel.detach();
  } catch (error) {
    console.warn('Failed to detach Ably channel', error);
  }
};

export function useAblyChannel(
  channelName: string,
  {
    channelOptions,
    events,
    onMessage,
    onPresenceUpdate,
    onStateChange,
    retainOnUnmount = false,
    skip = false,
  }: UseAblyChannelOptions = {},
) {
  const client = useAblyClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const eventsArray = useMemo(() => toArray(events), [events]);

  useEffect(() => {
    if (skip) {
      return;
    }

    const ablyChannel = client.channels.get(channelName, channelOptions);

    const handleChannelState = (change: ChannelStateChange) => {
      onStateChange?.(change);
    };

    ablyChannel.on(handleChannelState);

    setChannel(ablyChannel);

    const listener = (message: Message) => {
      onMessage?.(message);
    };

    if (onMessage) {
      if (eventsArray?.length) {
        eventsArray.forEach((eventName) => ablyChannel.subscribe(eventName, listener));
      } else {
        ablyChannel.subscribe(listener);
      }
    }

    return () => {
      ablyChannel.off(handleChannelState);

      if (onMessage) {
        if (eventsArray?.length) {
          eventsArray.forEach((eventName) => ablyChannel.unsubscribe(eventName, listener));
        } else {
          ablyChannel.unsubscribe(listener);
        }
      }

      if (!retainOnUnmount) {
        detachChannel(ablyChannel);
      }
    };
  }, [channelName, channelOptions, client, eventsArray, onMessage, onStateChange, retainOnUnmount, skip]);

  useEffect(() => {
    if (!channel || skip || !onPresenceUpdate) {
      return;
    }

    const presenceListener = (presence: PresenceMessage) => {
      onPresenceUpdate(presence);
    };

    channel.presence.subscribe(presenceListener);

    return () => {
      channel.presence.unsubscribe(presenceListener);
    };
  }, [channel, onPresenceUpdate, skip]);

  const publish = useCallback(
    async (eventName: string, data: unknown) => {
      if (!channel) {
        throw new Error('Attempted to publish to a channel that is not ready.');
      }

      await channel.publish(eventName, data);
    },
    [channel],
  );

  const fetchHistory = useCallback(
    async (params?: Parameters<RealtimeChannel['history']>[0]) => {
      if (!channel) {
        throw new Error('Attempted to read history on a channel that is not ready.');
      }

      return channel.history(params);
    },
    [channel],
  );

  return useMemo(
    () => ({
      channel,
      publish,
      fetchHistory,
    }),
    [channel, fetchHistory, publish],
  );
}
