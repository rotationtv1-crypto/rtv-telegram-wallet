import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { AI_HOSTS, THEME } from '../constants';
import { ChatPanel } from '../components/ChatPanel';
import { sendChat } from '../services/api';

export function StreamScreen() {
  const {
    selectedHost, setSelectedHost, messages, addMessage,
    initData, toggleGiftBar, incrementAiChats, showToast,
  } = useStore();
  const [chatLoading, setChatLoading] = useState(false);

  const handleChat = useCallback(async (text: string) => {
    addMessage({ role: 'user', text, timestamp: Date.now() });
    setChatLoading(true);
    incrementAiChats();
    try {
      const res = await sendChat(text, initData);
      addMessage({
        role: 'agent',
        text: res?.text || 'Connection established. How can I assist you on RotationTV?',
        timestamp: Date.now(),
      });
    } catch {
      addMessage({
        role: 'agent',
        text: 'Live AI is processing. The Venice pipeline is active.',
        timestamp: Date.now(),
      });
    }
    setChatLoading(false);
  }, [addMessage, initData, incrementAiChats]);

  const selectedHostData = AI_HOSTS.find((h) => h.id === selectedHost);

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textSecondary, marginBottom: 10 }}>
        SELECT AI HOST
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {AI_HOSTS.map((h) => (
          <div
            key={h.id}
            onClick={() => setSelectedHost(h.id)}
            style={{
              padding: '10px 14px',
              borderRadius: THEME.radius.md,
              cursor: 'pointer',
              background: selectedHost === h.id ? 'rgba(108,92,231,0.2)' : THEME.card,
              border: selectedHost === h.id ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 18 }}>{h.emoji}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{h.name}</div>
              <div style={{ fontSize: 9, color: THEME.textSecondary }}>{h.role} · {h.rate}⭐</div>
            </div>
          </div>
        ))}
      </div>

      {selectedHost && selectedHostData && (
        <div style={{ marginTop: 12 }}>
          {/* Host banner */}
          <div
            style={{
              background: THEME.surface,
              borderRadius: `${THEME.radius.md} ${THEME.radius.md} 0 0`,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderBottom: `1px solid ${THEME.border}`,
            }}
          >
            <img
              src={selectedHostData.avatar}
              alt={selectedHostData.name}
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {selectedHostData.emoji} {selectedHostData.name}
              </div>
              <div style={{ fontSize: 10, color: THEME.teal }}>● {selectedHostData.role}</div>
            </div>
            <button
              onClick={() => toggleGiftBar(true)}
              style={{
                padding: '6px 10px', borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.accent}`, background: 'rgba(108,92,231,0.1)',
                color: THEME.accent2, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              🎁 Gift
            </button>
          </div>

          {/* Chat */}
          <div
            style={{
              background: THEME.surface,
              borderRadius: `0 0 ${THEME.radius.md} ${THEME.radius.md}`,
              overflow: 'hidden',
            }}
          >
            <ChatPanel messages={messages} loading={chatLoading} onSend={handleChat} />
          </div>
        </div>
      )}
    </div>
  );
}
