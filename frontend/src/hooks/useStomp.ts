import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function createStompClient(token?: string) {
  const base =
    import.meta.env.VITE_WS_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080";
  const url = base.replace(/^http/, "ws") + "/ws";
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
