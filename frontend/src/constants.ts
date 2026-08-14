export const THEME = {
  bg: '#0D0D0D', surface: '#1A1A2E', card: '#16213E', text: '#FFFFFF',
  textSecondary: '#B2B2B2', accent: '#6C5CE7', accent2: '#A29BFE',
  teal: '#00CEC9', success: '#00B894', error: '#FF6B6B', warning: '#FDCB6E',
  border: 'rgba(108,92,231,0.15)', borderActive: 'rgba(108,92,231,0.3)',
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  font: "'Inter', -apple-system, sans-serif",
};

export const AI_HOSTS = [
  { id: 'leo', name: 'LEO', role: 'Anchor', emoji: '🎙️', color: '#6C5CE7', rate: 100, avatar: 'https://media.base44.com/images/public/69f330e280d516038e46c473/d4e7c3275_generated_image.png' },
  { id: 'maya', name: 'MAYA', role: 'Energetic', emoji: '⚡', color: '#A29BFE', rate: 100, avatar: 'https://media.base44.com/images/public/69f330e280d516038e46c473/c9318bb00_generated_image.png' },
  { id: 'reed', name: 'DR. REED', role: 'Analyst', emoji: '📊', color: '#00CEC9', rate: 150, avatar: 'https://media.base44.com/images/public/69f330e280d516038e46c473/3b36297e5_generated_image.png' },
  { id: 'zara', name: 'ZARA', role: 'Wildcard', emoji: '🔥', color: '#FF6B6B', rate: 130, avatar: 'https://media.base44.com/images/public/69f330e280d516038e46c473/ef3ac3705_generated_image.png' },
  { id: 'omar', name: 'OMAR', role: 'Chill', emoji: '🌊', color: '#00B894', rate: 80, avatar: 'https://media.base44.com/images/public/69f330e280d516038e46c473/e8a701b03_generated_image.png' },
  { id: 'lina', name: 'LINA', role: 'Co-Host', emoji: '✨', color: '#FDCB6E', rate: 100, avatar: 'https://media.base44.com/images/public/69f330e280d516038e46c473/d490e8695_generated_image.png' },
];

export const GIFTS = [
  { id: 'rose', label: '🌹 Rose', stars: 1 },
  { id: 'beer', label: '🍺 Beer', stars: 5 },
  { id: 'fire', label: '🔥 Fire', stars: 10 },
  { id: 'heart', label: '💖 Heart', stars: 25 },
  { id: 'diamond', label: '💎 Diamond', stars: 50 },
  { id: 'rocket', label: '🚀 Rocket', stars: 100 },
  { id: 'crown', label: '👑 Crown', stars: 500 },
];

export const SUBSCRIPTIONS = [
  { id: 'basic', label: 'Basic', hosts: '1 Host', stars: 100, perks: ['1 AI Host','Standard quality','Chat access'], color: '#6C5CE7' },
  { id: 'pro', label: 'Pro', hosts: '3 Hosts', stars: 300, perks: ['3 AI Hosts','HD quality','Priority chat','Gift sending'], color: '#A29BFE' },
  { id: 'enterprise', label: 'Enterprise', hosts: 'All 6 Hosts', stars: 999, perks: ['All 6 AI Hosts','4K quality','VIP chat','Custom requests','No ads'], color: '#00CEC9' },
];

export const NAV_ITEMS = [
  { icon: '🔍', label: 'Discover', key: 'discover' as const },
  { icon: '📺', label: 'Stream', key: 'stream' as const },
  { icon: '⭐', label: 'Wallet', key: 'wallet' as const },
  { icon: '👤', label: 'Profile', key: 'profile' as const },
];
