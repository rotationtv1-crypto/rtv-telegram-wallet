import { useAgent } from "agents/react";
import { useState, useCallback } from "react";

interface AgentState {
  stream_id: string;
  creator_id: string;
  insights: string[];
  understanding: number;
  moderation_score: number;
  safety_flags: string[];
  viewer_sentiment: "positive" | "neutral" | "negative";
  total_messages_analyzed: number;
}

interface ModerationResult {
  action: "allow" | "warn" | "ban";
  reason: string;
  severity: number;
}

/**
 * useStreamAgent — React hook connecting to RTVStreamAgent via WebSocket
 * Real-time moderation, insights, reasoning
 */
export function useStreamAgent(streamId: string) {
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [lastModeration, setLastModeration] = useState<ModerationResult | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [reasoningResponse, setReasoningResponse] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const connection = useAgent({
    agent: "rtv-stream-agent",
    name: `stream-${streamId}`,
    onOpen: () => { setConnected(true); },
    onClose: () => { setConnected(false); },
    onMessage: (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case "agent_connected":    setAgentState(data.state); break;
        case "moderation_result":  setLastModeration({ action: data.action, reason: data.reason, severity: data.severity }); break;
        case "moderation_update":  setAgentState((prev) => prev ? { ...prev, moderation_score: data.moderation_score, viewer_sentiment: data.viewer_sentiment, total_messages_analyzed: data.messages_analyzed } : null); break;
        case "user_banned":        console.warn(`User banned: ${data.username} - ${data.reason}`); break;
        case "insights":           setInsights(data.insights || []); break;
        case "creator_insight":    setInsights((prev) => [...prev, data.insight]); break;
        case "reasoning_response": setReasoningResponse(data.response); break;
        case "frame_analysis":     setAgentState((prev) => prev ? { ...prev, moderation_score: data.moderation_score, safety_flags: data.safety_flags } : null); break;
        case "payout_complete":    console.log("Payout workflow complete:", data); break;
      }
    },
    onStateUpdate: (newState: AgentState) => { setAgentState(newState); },
  });

  const sendMessage = useCallback((text: string, userId: string, username: string) => {
    connection.send(JSON.stringify({ type: "chat_message", text, user_id: userId, username }));
  }, [connection]);

  const requestInsights = useCallback(() => {
    connection.send(JSON.stringify({ type: "request_insights" }));
  }, [connection]);

  const inquire = useCallback((content: string, userId: string) => {
    connection.send(JSON.stringify({ type: "inquiry", user_id: userId, content }));
  }, [connection]);

  const sendFrame = useCallback((frameBase64: string) => {
    connection.send(JSON.stringify({ type: "stream_frame", frame_base64: frameBase64 }));
  }, [connection]);

  return { connected, agentState, lastModeration, insights, reasoningResponse, sendMessage, requestInsights, inquire, sendFrame };
}
