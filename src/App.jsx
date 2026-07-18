// ============================================
// ROTATIONTV — ROOT APP ENTRY
// DO NOT MODIFY THEME OR SPECS
// ============================================

import React, { useState } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import RotationTVMiniApp from './RotationTVMiniApp';
import BroadcastGrid from './broadcast/BroadcastGrid';

const MANIFEST_URL = 'https://rotationtv.network/tonconnect-manifest.json';

export default function App() {
  const [mode, setMode] = useState('miniapp'); // 'miniapp' | 'broadcast'

  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      {/* Mode switcher (hidden in production — admin only) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={modeSwitcherStyle}>
          <button onClick={() => setMode('miniapp')} style={btnStyle}>Mini App</button>
          <button onClick={() => setMode('broadcast')} style={btnStyle}>Broadcast Grid</button>
        </div>
      )}

      {mode === 'miniapp' && <RotationTVMiniApp />}
      {mode === 'broadcast' && (
        <BroadcastGrid
          onHumanArrival={() => console.log('Human hosts are live!')}
        />
      )}
    </TonConnectUIProvider>
  );
}

const modeSwitcherStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  zIndex: 9999,
  display: 'flex',
  gap: 4,
  padding: 4,
  background: '#1A1A2E',
};

const btnStyle = {
  background: '#6C5CE7',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
};
