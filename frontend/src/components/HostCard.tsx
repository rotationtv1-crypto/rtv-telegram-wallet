import { THEME } from '../constants';

interface HostCardProps {
  host: any;
  selected: boolean;
  onClick: () => void;
}

export function HostCard({ host, selected, onClick }: HostCardProps) {
  return (
    <div onClick={onClick} style={{
      background: THEME.card, borderRadius: THEME.radius.md, overflow: 'hidden',
      cursor: 'pointer', border: selected ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
      transition: 'border-color 0.15s',
    }}>
      <div style={{
        height: 80, background: `linear-gradient(135deg, ${host.color}33, ${host.color}11)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
      }}>
        {host.avatar ? (
          <img src={host.avatar} alt={host.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const p = (e.target as HTMLImageElement).parentElement; if (p) p.innerHTML = `<span style="font-size:32px">${host.emoji}</span>`; }} />
        ) : <span style={{ fontSize: 32 }}>{host.emoji}</span>}
        {host.live && <span style={{ position: 'absolute', top: 4, right: 4, background: THEME.error, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>LIVE</span>}
      </div>
      <div style={{ padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{host.name}</span>
          <span style={{ fontSize: 9, color: host.live ? THEME.success : THEME.textSecondary }}>{host.live ? '● LIVE' : 'Offline'}</span>
        </div>
        <div style={{ fontSize: 9, color: THEME.textSecondary }}>{host.role} · {host.viewers || 0} watching</div>
        <div style={{ fontSize: 10, color: THEME.accent2, fontWeight: 600 }}>{host.rate || 0} ⭐/hr</div>
      </div>
    </div>
  );
}
