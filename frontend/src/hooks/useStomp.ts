// src/hooks/useStomp.ts
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Robust useStomp hook
 * - uses SockJS with an HTTP(S) url (SockJS requires http/https, not ws/wss)
 * - queues subscriptions requested before connection is ready
 *
 * IMPORTANT:
 * - Ensure VITE_API_BASE_URL is set (e.g. http://localhost:8080)
 * - Ensure backend STOMP endpoint path matches `/ws` (change `wsPath` below if different)
 */

export type StompClientWrapper = {
  isConnected: () => boolean;
  subscribe: (destination: string, callback: (msg: IMessage) => void) => StompSubscription | null;
  publish: (destination: string, body?: any) => void;
  activate: () => void;
  deactivate: () => Promise<void>;
};

export default function useStomp(): StompClientWrapper {
  const clientRef = useRef<Client | null>(null);
  const pendingSubsRef = useRef<Array<{ dest: string; cb: (m: IMessage) => void }>>([]);
  const activeSubsRef = useRef<StompSubscription[]>([]);

  useEffect(() => {
    // Build an HTTP(S) URL for SockJS — SockJS expects http(s)
    const baseHttp = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(
      /\/+$/,
      '',
    );
    const wsPath = '/ws'; // <- change this if your backend uses another path
    const sockJsUrl = `${baseHttp}${wsPath}`;

    const client = new Client({
      // Provide a webSocketFactory returning a SockJS instance built over an HTTP URL
      webSocketFactory: () => new SockJS(sockJsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      debug: (str) => {
        // keep debugging quiet in prod; useful while developing
        // console.debug("[STOMP]", str);
      },
    });

    // onConnect: flush pending subscriptions
    client.onConnect = () => {
      console.debug('[STOMP] connected');
      // register queued subscriptions
      pendingSubsRef.current.forEach((s) => {
        try {
          const sub = client.subscribe(s.dest, s.cb);
          if (sub) activeSubsRef.current.push(sub);
        } catch (e) {
          console.error('[STOMP] subscribe error onConnect', e);
        }
      });
      pendingSubsRef.current = [];
    };

    client.onWebSocketClose = (evt) => {
      console.debug('[STOMP] websocket closed', evt);
    };

    client.onStompError = (frame) => {
      console.error('[STOMP] broker reported error: ' + frame.headers['message']);
      console.error('[STOMP] additional details: ' + frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        // unsubscribe active subs
        activeSubsRef.current.forEach((s) => {
          try {
            s.unsubscribe();
          } catch (e) {}
        });
        activeSubsRef.current = [];
        pendingSubsRef.current = [];
        // deactivate client
        client.deactivate();
      } catch (e) {}
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isConnected = useCallback(() => {
    return !!(clientRef.current && clientRef.current.connected);
  }, []);

  const subscribe = useCallback((
    destination: string,
    callback: (msg: IMessage) => void,
  ): StompSubscription | null => {
    const c = clientRef.current;
    if (!c) {
      console.warn('[STOMP] client not initialized - queuing subscription:', destination);
      pendingSubsRef.current.push({ dest: destination, cb: callback });
      return null;
    }

    if (c.connected) {
      try {
        const sub = c.subscribe(destination, callback);
        if (sub) activeSubsRef.current.push(sub);
        return sub;
      } catch (e) {
        console.error('[STOMP] subscribe error', e);
        return null;
      }
    } else {
      // not connected yet - queue it
      pendingSubsRef.current.push({ dest: destination, cb: callback });
      return null;
    }
  }, []);

  const publish = useCallback((destination: string, body?: any) => {
    const c = clientRef.current;
    if (!c || !c.connected) {
      console.warn('[STOMP] publish called but client not connected', destination);
      return;
    }
    try {
      c.publish({ destination, body: body ? JSON.stringify(body) : '' });
    } catch (e) {
      console.error('[STOMP] publish error', e);
    }
  }, []);

  const deactivate = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    try {
      // unsubscribe active
      activeSubsRef.current.forEach((s) => {
        try {
          s.unsubscribe();
        } catch (e) {}
      });
      activeSubsRef.current = [];
      pendingSubsRef.current = [];
      await c.deactivate();
    } catch (e) {
      // ignore
    } finally {
      clientRef.current = null;
    }
  }, []);

  const activate = useCallback(() => {
    clientRef.current?.activate();
  }, []);

  return useMemo(() => ({
    isConnected,
    subscribe,
    publish,
    activate,
    deactivate,
  }), [isConnected, subscribe, publish, activate, deactivate]);
}

export function createStompClient(token?: string) {
  const base =
    import.meta.env.VITE_WS_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:8080';
  const url = base.replace(/^http/, 'ws') + '/ws';
  const client = new Client({
    // Use SockJS for fallback
    webSocketFactory: () => new SockJS(url),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 20000,
  });
  return client;
}
