import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Realtime } from 'ably';
import type { ClientOptions, Realtime as AblyRealtime, ConnectionStateChange, ConnectionState } from 'ably';

interface AblyProviderProps {
  /**
   * API key provided by Ably. Prefer providing the key via secure configuration rather than hardcoding.
   */
  apiKey?: string;
  /**
   * Optional authentication URL if you rely on Ably token authentication.
   */
  authUrl?: string;
  /**
   * Optional client identifier forwarded to Ably to simplify presence tracking.
   */
  clientId?: string;
  /**
   * Additional options forwarded to the Realtime client. Values provided here take precedence over the shorthand props.
   */
  options?: ClientOptions;
  /**
   * Callback fired whenever the connection state updates. Useful for debugging connection lifecycle.
   */
  onConnectionStateChange?: (change: ConnectionStateChange) => void;
  /**
   * When true the connection is not opened automatically. Useful for deferred connections.
   */
  autoConnect?: boolean;
  children: React.ReactNode;
}

interface AblyContextValue {
  client: AblyRealtime | null;
  connectionState: ConnectionState | null;
}

const AblyContext = createContext<AblyContextValue | null>(null);

const DEFAULT_OPTIONS: Partial<ClientOptions> = {
  autoConnect: true,
  echoMessages: true,
};

function mergeClientOptions(
  baseOptions: ClientOptions | undefined,
  overrides: Partial<ClientOptions>,
): ClientOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...baseOptions,
    ...overrides,
  } as ClientOptions;
}

export function AblyProvider({
  apiKey,
  authUrl,
  clientId,
  options,
  onConnectionStateChange,
  autoConnect = true,
  children,
}: AblyProviderProps) {
  const [client, setClient] = useState<AblyRealtime | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const clientRef = useRef<AblyRealtime | null>(null);

  const memoizedOptions = useMemo(() => {
    const shorthandOverrides: Partial<ClientOptions> = {};

    if (apiKey) {
      shorthandOverrides.key = apiKey;
    }

    if (authUrl) {
      shorthandOverrides.authUrl = authUrl;
    }

    if (clientId) {
      shorthandOverrides.clientId = clientId;
    }

    if (autoConnect === false) {
      shorthandOverrides.autoConnect = false;
    }

    return mergeClientOptions(options, shorthandOverrides);
  }, [apiKey, authUrl, clientId, options, autoConnect]);

  useEffect(() => {
    if (!memoizedOptions.key && !memoizedOptions.authUrl) {
      console.warn(
        'AblyProvider requires either an apiKey prop or an authUrl/token strategy provided through options.',
      );
      return undefined;
    }

    const realtime = new Realtime(memoizedOptions);

    clientRef.current = realtime;
    setClient(realtime);

    const handleConnectionChange = (change: ConnectionStateChange) => {
      setConnectionState(change.current);
      if (onConnectionStateChange) {
        onConnectionStateChange(change);
      }
    };

    realtime.connection.on(handleConnectionChange);

    if (memoizedOptions.autoConnect !== false) {
      realtime.connect();
    }

    return () => {
      realtime.connection.off(handleConnectionChange);
      realtime.close();
      clientRef.current = null;
      setClient(null);
      setConnectionState(null);
    };
  }, [memoizedOptions, onConnectionStateChange]);

  const value = useMemo<AblyContextValue>(
    () => ({
      client,
      connectionState,
    }),
    [client, connectionState],
  );

  return <AblyContext.Provider value={value}>{children}</AblyContext.Provider>;
}

export function useAblyClient(): AblyRealtime {
  const context = useContext(AblyContext);

  if (!context?.client) {
    throw new Error('useAblyClient must be used within an AblyProvider.');
  }

  return context.client;
}

export function useAblyConnectionState() {
  const context = useContext(AblyContext);

  if (!context) {
    throw new Error('useAblyConnectionState must be used within an AblyProvider.');
  }

  return context.connectionState;
}
