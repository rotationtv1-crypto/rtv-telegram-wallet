import { useState, useRef, useEffect } from "react";
import { useStreamAgent } from "../hooks/useStreamAgent";

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  text: string;
  ts: number;
  is_creator?: boolean;
  is_tip?: boolean;
  tip_amount_rtv?: number;
  gift_emoji?: string;
  moderation_action?: "allow" | "warn" | "ban";
}

interface AgentChatProps {
  streamId: string;
  currentUserId: string;
  currentUsername: string;
  isCreator: boolean;
}

export function AgentChat({ streamId, currentUserId, currentUsername, isCreator }: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showInsights, setShowInsights] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { connected, agentState, lastModeration, insights, reasoningResponse, sendMessage, requestInsights, inquire } = useStreamAgent(streamId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = { id: crypto.randomUUID(), user_id: currentUserId, username: currentUsername, text: input, ts: Date.now(), is_creator: isCreator };
    setMessages((prev) => [...prev, msg]);
    sendMessage(input, currentUserId, currentUsername);
    setInput("");
  };

  useEffect(() => {
    if (lastModeration && messages.length > 0) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = { ...updated[lastIdx], moderation_action: lastModeration.action };
        return updated;
      });
    }
  }, [lastModeration]);

  const scoreColor = agentState
    ? agentState.moderation_score >= 80 ? "#CCFF00"
    : agentState.moderation_score >= 50 ? "#FFA500"
    : "#FF006E"
    : "#666";

  return (
    <div className="flex flex-col" style={{ height: "45%", background: "rgba(0,0,0,0.85)", borderTop: "1px solid #222" }}>

      {/* Agent Status Bar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: connected ? "#CCFF00" : "#666" }} />
          <span className="text-xs font-medium" style={{ color: connected ? "#CCFF00" : "#666" }}>
            {connected ? "AI Agent Online" : "Connecting..."}
          </span>
        </div>
        {agentState && (
          <div className="flex items-center gap-3 text-xs">
            <span style={{ color: scoreColor }}>Safety: {agentState.moderation_score}</span>
            <span style={{ color: "#666" }}>{agentState.total_messages_analyzed} msgs</span>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <span className="text-xs font-bold" style={{ color: msg.is_creator ? "#CCFF00" : "#A29BFE" }}>
              {msg.is_creator && "👑 "}{msg.username}
            </span>
            {msg.moderation_action === "warn" && (
              <span className="text-xs px-1 rounded" style={{ background: "rgba(255,165,0,0.2)", color: "#FFA500" }}>⚠️ warned</span>
            )}
            {msg.moderation_action === "ban" && (
              <span className="text-xs px-1 rounded" style={{ background: "rgba(255,0,0,0.2)", color: "#FF6B6B" }}>🚫 banned</span>
            )}
            <span className="text-xs text-white flex-1">{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Insights Panel */}
      {showInsights && (
        <div className="px-3 py-2" style={{ background: "rgba(204,255,0,0.05)", borderTop: "1px solid rgba(204,255,0,0.1)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: "#CCFF00" }}>🧠 AI Insights</span>
            <button onClick={() => inquire("Summarize stream performance", currentUserId)} style={{ color: "#00BFFF", fontSize: 11 }}>Ask AI →</button>
          </div>
          {insights.length === 0 ? (
            <span className="text-xs" style={{ color: "#666" }}>No insights yet</span>
          ) : (
            insights.slice(-5).map((insight, i) => (
              <p key={i} className="text-xs" style={{ color: "#B2B2B2" }}>• {insight}</p>
            ))
          )}
          {reasoningResponse && (
            <p className="text-xs mt-2 p-2 rounded" style={{ background: "#141414", color: "white" }}>{reasoningResponse}</p>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: "1px solid #1a1a1a" }}>
        <button
          onClick={() => { setShowInsights(!showInsights); requestInsights(); }}
          className="px-2 py-1 rounded-lg"
          style={{ background: showInsights ? "rgba(204,255,0,0.2)" : "#141414" }}
        >
          <span style={{ fontSize: 14 }}>🧠</span>
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send a message..."
          className="flex-1 px-3 py-2 rounded-full outline-none"
          style={{ background: "#141414", color: "white", fontSize: 13 }}
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 rounded-full text-xs font-bold text-black"
          style={{ background: "#CCFF00" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
