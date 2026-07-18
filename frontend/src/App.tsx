import { useState, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { decodeState, encodeState } from './utils/base44';
import { sendChat } from './services/api';

const THEME = {
  bg: '#0D0D0D',
  surface: '#1A1A2E',
  card: '#16213E',
  text: '#FFFFFF',
  textSecondary: '#B2B2B2',
  accent: '#6C5CE7',
  accent2: '#A29BFE',
  success: '#00B894',
  error: '#FF6B6B',
};

interface Message {
  role: 'user' | 'agent';
  text: string;
  sources?: Array<{ link: string; snippet: string }>;
  timestamp: number;
}

export default function App() {
  const { tg, user, initData, startParam } = useTelegram();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stateContext] = useState(() => decodeState(startParam));

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const prompt = input.trim();
    setInput('');
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: prompt, timestamp: Date.now() },
    ]);

    try {
      const encoded = encodeState(stateContext);
      const result = await sendChat(prompt, encoded, initData);

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: result.response,
          sources: result.sources,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `Error: ${err.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, initData, stateContext]);

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.bg,
      color: THEME.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: THEME.surface,
        borderBottom: `1px solid ${THEME.accent}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
        }}>R</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>RotationTV Agent</div>
          <div style={{ fontSize: 12, color: THEME.textSecondary }}>
            Kimi-Claw · Gemini 2.5 Flash
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: THEME.textSecondary,
            marginTop: '40px',
            fontSize: 14,
          }}>
            Ask me anything. I can search the web in real-time.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? THEME.accent : THEME.card,
              fontSize: 14,
              lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div style={{
                marginTop: '6px',
                fontSize: 11,
                color: THEME.textSecondary,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}>
                {msg.sources.map((s, j) => (
                  <a key={j} href={s.link} style={{
                    color: THEME.accent2,
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    → {s.link}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '12px 16px',
            borderRadius: '16px 16px 16px 4px',
            background: THEME.card,
            fontSize: 14,
            color: THEME.textSecondary,
          }}>
            Searching web + generating...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        background: THEME.surface,
        borderTop: `1px solid ${THEME.card}`,
        display: 'flex',
        gap: '8px',
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Kimi-Claw..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            background: THEME.card,
            color: THEME.text,
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: THEME.accent,
            color: THEME.text,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
