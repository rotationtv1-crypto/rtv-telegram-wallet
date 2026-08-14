import { THEME } from '../constants';
import { useStore } from '../store/useStore';

export function Toast() {
  const { toast } = useStore();

  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        background: THEME.card, padding: '10px 20px', borderRadius: 20,
        border: `1px solid ${THEME.success}30`, fontSize: 13, zIndex: 300,
        whiteSpace: 'nowrap',
      }}
    >
      {toast}
    </div>
  );
}
