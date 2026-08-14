import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { AI_HOSTS, THEME } from '../constants';
import { HostCard } from '../components/HostCard';
import { fetchLiveStreams } from '../services/api';

export function DiscoverScreen() {
  const { streams, setStreams, selectedHost, setSelectedHost, toggleGiftBar, toggleSubscribe } = useStore();

  useEffect(() => {
    fetchLiveStreams().then((data) => {
      if (data?.streams?.length) {
        setStreams(data.streams);
      } else {
        setStreams(AI_HOSTS.map((h) => ({ ...h, live: false, viewers: 0 })));
      }
    }).catch(() => {
      setStreams(AI_HOSTS.map((h) => ({ ...h, live: false, viewers: 0 })));
    });
  }, []);

  return (
    <div>
      <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: THEME.textSecondary }}>
        LIVE NOW
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px' }}>
        {streams.map((s: any) => (
          <HostCard
            key={s.id}
            host={s}
            selected={selectedHost === s.id}
            onClick={() => setSelectedHost(s.id)}
          />
        ))}
      </div>
      <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => toggleGiftBar(true)}
          style={{
            flex: 1, padding: 10, borderRadius: THEME.radius.md,
            border: `1px solid ${THEME.accent}`, background: 'rgba(108,92,231,0.1)',
            color: THEME.accent2, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          🎁 Send Gift
        </button>
        <button
          onClick={() => toggleSubscribe(true)}
          style={{
            flex: 1, padding: 10, borderRadius: THEME.radius.md, border: 'none',
            background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent2})`,
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          ⭐ Subscribe
        </button>
      </div>
    </div>
  );
}
