// ============================================
// ROTATIONTV — BROADCAST GRID COMPONENT
// DO NOT MODIFY THEME/GRAPHICS SPECS
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { AI_HOSTS, HANDOFF_CONFIG } from './AI_HOSTS_CONFIG';

// ============================================
// LOCKED THEME — DO NOT CHANGE
// ============================================
const THEME = {
  colors: {
    primary: '#6C5CE7',
    secondary: '#A29BFE',
    accent: '#00CEC9',
    background: '#0D0D0D',
    surface: '#1A1A2E',
    card: '#16213E',
    text: '#FFFFFF',
    textSecondary: '#B2B2B2',
    success: '#00B894',
    error: '#FF6B6B',
    warning: '#FDCB6E',
  },
  fonts: {
    primary: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
};

// ============================================
// BROADCAST STATES
// ============================================
const STATES = {
  AI_ONLY: 'AI_ONLY',
  HANDOFF_INITIATED: 'HANDOFF_INITIATED',
  HANDOFF_IN_PROGRESS: 'HANDOFF_IN_PROGRESS',
  HUMAN_LIVE: 'HUMAN_LIVE',
  FALLBACK: 'FALLBACK',
  TECHNICAL_DIFFICULTIES: 'TECHNICAL_DIFFICULTIES',
};

// ============================================
// AI HOST CARD
// ============================================
function AIHostCard({ host, isExiting, isSpeaking, onExitComplete }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setOpacity(0);
        setTimeout(() => onExitComplete?.(host.id), 1500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isExiting]);

  return (
    <div
      style={{
        ...styles.hostCard,
        opacity,
        transition: 'opacity 1.5s ease',
        border: isSpeaking
          ? `2px solid ${THEME.colors.accent}`
          : `1px solid ${THEME.colors.surface}`,
        boxShadow: isSpeaking ? `0 0 20px ${THEME.colors.accent}44` : 'none',
      }}
    >
      {/* AI Host Avatar — generated photorealistic portrait */}
      <div style={styles.avatarArea}>
        <div style={styles.avatarContainer}>
          {host.avatarUrl ? (
            <img
              src={host.avatarUrl}
              alt={host.name}
              style={styles.avatarImage}
            />
          ) : (
            <div style={styles.avatarPlaceholder}>
              <span style={styles.avatarEmoji}>
                {host.gender === 'female' ? '👩' : '👨'}
              </span>
            </div>
          )}
          {isSpeaking && <div style={styles.speakingIndicator} />}
        </div>
      </div>

      {/* Host Info */}
      <div style={styles.hostInfo}>
        <span style={styles.hostName}>{host.name}</span>
        <span style={styles.hostRole}>{host.role}</span>
      </div>

      {/* Exit Line Bubble */}
      {isExiting && (
        <div style={styles.exitBubble}>
          <p style={styles.exitText}>{host.exitLine}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN BROADCAST GRID
// ============================================
export default function BroadcastGrid({ onHumanArrival, adminOverride }) {
  const [broadcastState, setBroadcastState] = useState(STATES.AI_ONLY);
  const [activeHosts, setActiveHosts] = useState(AI_HOSTS);
  const [exitingHosts, setExitingHosts] = useState([]);
  const [speakingHostId, setSpeakingHostId] = useState('leo');
  const [humanCount, setHumanCount] = useState(0);
  const [fallbackTimer, setFallbackTimer] = useState(null);
  const [gridVisible, setGridVisible] = useState(true);

  // ---- Handoff Sequence ----
  const initiateHandoff = useCallback((humans) => {
    setBroadcastState(STATES.HANDOFF_INITIATED);
    setHumanCount(humans);

    const hostsToExit = humans >= 2 ? AI_HOSTS : AI_HOSTS.slice(0, -1);
    let delay = 0;

    hostsToExit.forEach((host, i) => {
      setTimeout(() => {
        setSpeakingHostId(host.id);
        setExitingHosts((prev) => [...prev, host.id]);
      }, delay);
      delay += HANDOFF_CONFIG.exitSequenceDelay;
    });

    // After all exit lines — fade grid
    setTimeout(() => {
      setBroadcastState(STATES.HANDOFF_IN_PROGRESS);
      setGridVisible(false);
      setTimeout(() => {
        setBroadcastState(STATES.HUMAN_LIVE);
        onHumanArrival?.();
      }, HANDOFF_CONFIG.transitionDuration);
    }, delay + 1000);
  }, [onHumanArrival]);

  // ---- Admin Override ----
  useEffect(() => {
    if (adminOverride === 'human_arrived_1') initiateHandoff(1);
    if (adminOverride === 'human_arrived_2') initiateHandoff(2);
    if (adminOverride === 'technical_difficulties') {
      setBroadcastState(STATES.TECHNICAL_DIFFICULTIES);
    }
  }, [adminOverride]);

  // ---- 15-min fallback timer ----
  useEffect(() => {
    const timer = setTimeout(() => {
      if (broadcastState === STATES.AI_ONLY) {
        setBroadcastState(STATES.FALLBACK);
      }
    }, HANDOFF_CONFIG.fallback.maxWaitMinutes * 60 * 1000);
    setFallbackTimer(timer);
    return () => clearTimeout(timer);
  }, []);

  const handleExitComplete = (hostId) => {
    setActiveHosts((prev) => prev.filter((h) => h.id !== hostId));
  };

  // ---- RENDER ----
  if (broadcastState === STATES.HUMAN_LIVE) {
    return (
      <div style={styles.humanLiveScreen}>
        <p style={styles.humanGreeting}>{HANDOFF_CONFIG.humanGreeting}</p>
      </div>
    );
  }

  if (broadcastState === STATES.TECHNICAL_DIFFICULTIES) {
    return (
      <div style={styles.techDiffScreen}>
        <span style={{ fontSize: 48 }}>📡</span>
        <p style={styles.techDiffText}>We're experiencing technical difficulties.</p>
        <p style={styles.techDiffSub}>Your AI hosts are holding it down — stay tuned.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.gridContainer,
        opacity: gridVisible ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }}
    >
      {/* Broadcast Header */}
      <div style={styles.broadcastHeader}>
        <div style={styles.liveIndicator}>
          <span style={styles.liveDot} />
          <span style={styles.liveText}>LIVE</span>
        </div>
        <span style={styles.channelName}>ROTATIONTV AI @ROTATIONTV</span>
        {broadcastState === STATES.FALLBACK && (
          <span style={styles.fallbackBadge}>AI Full Show Mode</span>
        )}
      </div>

      {/* 2-col × 3-row Grid */}
      <div style={styles.grid}>
        {activeHosts.map((host) => (
          <AIHostCard
            key={host.id}
            host={host}
            isExiting={exitingHosts.includes(host.id)}
            isSpeaking={speakingHostId === host.id}
            onExitComplete={handleExitComplete}
          />
        ))}
      </div>

      {/* Admin Control Bar */}
      <div style={styles.adminBar}>
        <button
          style={styles.adminButton}
          onClick={() => initiateHandoff(1)}
        >
          👤 1 Human Arrived
        </button>
        <button
          style={styles.adminButton}
          onClick={() => initiateHandoff(2)}
        >
          👥 2 Humans Arrived
        </button>
        <button
          style={{ ...styles.adminButton, background: THEME.colors.error }}
          onClick={() => setBroadcastState(STATES.TECHNICAL_DIFFICULTIES)}
        >
          📡 Tech Difficulties
        </button>
      </div>
    </div>
  );
}

// ============================================
// STYLES — LOCKED TO RTVS THEME
// ============================================
const styles = {
  gridContainer: {
    backgroundColor: THEME.colors.background,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: THEME.fonts.primary,
  },
  broadcastHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    backgroundColor: THEME.colors.surface,
    borderBottom: `1px solid ${THEME.colors.card}`,
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: THEME.colors.error,
    display: 'inline-block',
    animation: 'pulse 1.5s infinite',
  },
  liveText: {
    color: THEME.colors.error,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 2,
  },
  channelName: {
    color: THEME.colors.text,
    fontWeight: 600,
    fontSize: 14,
    flex: 1,
  },
  fallbackBadge: {
    backgroundColor: THEME.colors.warning,
    color: '#000',
    padding: '2px 8px',
    borderRadius: THEME.borderRadius.sm,
    fontSize: 11,
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr 1fr',
    gap: 4,
    flex: 1,
    padding: 4,
  },
  hostCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 140,
  },
  avatarArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: THEME.colors.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: THEME.colors.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: THEME.colors.success,
    border: `2px solid ${THEME.colors.card}`,
  },
  hostInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 8,
  },
  hostName: {
    color: THEME.colors.text,
    fontWeight: 700,
    fontSize: 13,
  },
  hostRole: {
    color: THEME.colors.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  exitBubble: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: `${THEME.colors.primary}CC`,
    borderRadius: THEME.borderRadius.sm,
    padding: '6px 8px',
  },
  exitText: {
    color: THEME.colors.text,
    fontSize: 10,
    margin: 0,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  adminBar: {
    display: 'flex',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: THEME.colors.surface,
    borderTop: `1px solid ${THEME.colors.card}`,
    justifyContent: 'center',
  },
  adminButton: {
    backgroundColor: THEME.colors.primary,
    color: THEME.colors.text,
    border: 'none',
    borderRadius: THEME.borderRadius.sm,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: THEME.fonts.primary,
  },
  humanLiveScreen: {
    backgroundColor: THEME.colors.background,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  humanGreeting: {
    color: THEME.colors.text,
    fontSize: 22,
    fontFamily: THEME.fonts.primary,
    fontWeight: 700,
    textAlign: 'center',
  },
  techDiffScreen: {
    backgroundColor: THEME.colors.background,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  techDiffText: {
    color: THEME.colors.text,
    fontSize: 18,
    fontFamily: THEME.fonts.primary,
    fontWeight: 600,
  },
  techDiffSub: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    fontFamily: THEME.fonts.primary,
  },
};
