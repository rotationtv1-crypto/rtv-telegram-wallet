import { useEffect, useRef, useState, useCallback } from "react";

export interface TipEvent {
  id: string;
  user_id: string;
  username: string;
  gift_emoji: string;
  tip_amount_rtv: number;
  ts: number;
}

interface RoomState {
  viewer_count: number;
  total_tips_rtv: number;
  tip_count: number;
  is_live: boolean;
}

/**
 * useStreamRoom — connects to the StreamRoom Durable Object's WebSocket
 * for a given stream, so every viewer sees tips/gifts fly in real time.
 * (Previously nothing on the frontend consumed this broadcast — tips were
 * sent to the backend and StreamRoom happily broadcast them, but no client
 * was ever listening.)
 */
export function useStreamRoom(streamId: string | null) {
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [tips, setTips] = useState<TipEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!streamId) return;
    let closedByUs = false;

    const connect = () => {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const base = (import.meta.env.VITE_API_BASE || `${window.location.origin}`).replace(/^https?:/, proto);
      const ws = new WebSocket(`${base}/stream/${streamId}/ws`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closedByUs) reconnectRef.current = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === "tip" && data.message) {
            const m = data.message;
            setTips((prev) => [
              ...prev.slice(-19),
              {
                id: `${m.user_id}-${m.ts}-${Math.random().toString(36).slice(2, 7)}`,
                user_id: m.user_id,
                username: m.username,
                gift_emoji: m.gift_emoji || "🎁",
                tip_amount_rtv: m.tip_amount_rtv || 0,
                ts: m.ts || Date.now(),
              },
            ]);
          }
          if (data.room_state) {
            setRoomState({
              viewer_count: data.room_state.viewer_count,
              total_tips_rtv: data.room_state.total_tips_rtv,
              tip_count: data.room_state.tip_count,
              is_live: data.room_state.is_live,
            });
          }
        } catch {
          // ignore malformed frames
        }
      };
    };

    connect();
    return () => {
      closedByUs = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [streamId]);

  const dismissTip = useCallback((id: string) => {
    setTips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { connected, roomState, tips, dismissTip };
}
