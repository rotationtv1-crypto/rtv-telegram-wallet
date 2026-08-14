import { useState, useRef, useEffect } from 'react';
import { THEME } from '../constants';

interface Message { role: 'user' | 'agent'; text: string; timestamp: number; }

interface ChatPanelProps {
  messages: Message[];
  loading: boolean;
  onSend: (text: string) => void;
}

export function ChatPanel({ messages, loading, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 240 }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxHeight: 180,
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 20, color: THEME.textSecondary, fontSize: 11 }}>
            Send a message to start chatting with the AI host
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
              background: msg.role === 'user' ? THEME.accent : THEME.card,
              color: msg.role === 'user' ? '#fff' : THEME.text,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: '4px 12px 12px 12px', background: THEME.card, fontSize: 12 }}>
            <span style={{ animation: 'pulse 1s infinite' }}>● ● ●</span>
            <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 6, padding: 8, borderTop: `1px solid ${THEME.border}` }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: THEME.radius.sm,
            border: `1px solid ${THEME.borderActive}`,
            background: THEME.surface,
            color: THEME.text,
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            padding: '8px 14px',
            borderRadius: THEME.radius.sm,
            border: 'none',
            background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`,
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
            cursor: loading ? 'wait' : 'pointer',
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
