// ============================================================
// VODFeed.tsx — "Tubi on Telegram" Persistent Content Feed
// RotationTV Network — TikTok-style vertical + Tubi-style browse
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ── Types ──

interface VODItem {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  cloudflare_video_id: string;
  playback_url: string;
  thumbnail_url: string;
  duration_sec: number;
  source_type: string;
  ai_summary: string;
  ai_mood: string;
  ai_chapters: { start_sec: number; title: string }[];
  view_count: number;
  like_count: number;
  share_count: number;
  save_count: number;
  is_premium: boolean;
  price_rtv: number;
  is_featured: boolean;
  published_at: string;
  creator_username?: string;
  creator_avatar?: string;
  creator_tier?: string;
}

interface FeedCategory {
  id: string;
  label: string;
  icon: string;
}

const CATEGORIES: FeedCategory[] = [
  { id: 'all', label: 'For You', icon: '✨' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'talk', label: 'Talk', icon: '🗣' },
  { id: 'dance', label: 'Dance', icon: '💃' },
  { id: 'comedy', label: 'Comedy', icon: '😂' },
  { id: 'education', label: 'Learn', icon: '📚' },
  { id: 'lifestyle', label: 'Life', icon: '🏠' },
  { id: 'highlights', label: 'Highlights', icon: '⭐' },
  { id: 'ai_generated', label: 'AI', icon: '🤖' },
  { id: 'clip', label: 'Clips', icon: '✂️' },
];

const MOOD_ICONS: Record<string, string> = {
  energetic: '⚡', chill: '🌊', funny: '😂', educational: '🧠',
  dramatic: '🎭', romantic: '💕', hype: '🔥',
};

const CATEGORY_COLORS: Record<string, string> = {
  gaming: 'bg-green-600', music: 'bg-purple-600', talk: 'bg-blue-600',
  dance: 'bg-pink-600', comedy: 'bg-yellow-600', education: 'bg-indigo-600',
  lifestyle: 'bg-orange-600', highlights: 'bg-amber-500',
  ai_generated: 'bg-cyan-600', clip: 'bg-red-600',
};

// ── Format Duration ──

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ── VOD Card Component ──

function VODCard({ item, onClick }: { item: VODItem; onClick: (id: string) => void }) {
  return (
    <div
      className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 cursor-pointer hover:border-gray-600 transition-colors"
      onClick={() => onClick(item.id)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-800">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {CATEGORIES.find(c => c.id === item.category)?.icon || '📺'}
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
          {formatDuration(item.duration_sec)}
        </div>

        {/* Category badge */}
        <div className={`absolute top-2 left-2 ${CATEGORY_COLORS[item.category] || 'bg-gray-600'} text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase`}>
          {item.category.replace('_', ' ')}
        </div>

        {/* Premium badge */}
        {item.is_premium && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">
            💎 {item.price_rtv} RTV
          </div>
        )}

        {/* AI mood indicator */}
        {item.ai_mood && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            {MOOD_ICONS[item.ai_mood] || '🎭'} {item.ai_mood}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">{item.title}</h3>

        {item.ai_summary && (
          <p className="text-gray-400 text-xs line-clamp-2 mb-2">{item.ai_summary}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={item.creator_avatar || '/default-avatar.png'}
              alt={item.creator_username}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-gray-300 text-xs">{item.creator_username}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <span>👁 {item.view_count > 1000 ? `${(item.view_count / 1000).toFixed(1)}K` : item.view_count}</span>
            <span>❤️ {item.like_count}</span>
            <span>{timeAgo(item.published_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Featured Banner ──

function FeaturedBanner({ items }: { items: VODItem[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;
  const item = items[current];

  return (
    <div className="relative h-48 rounded-xl overflow-hidden mb-4">
      <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-full font-bold">⭐ FEATURED</span>
          {item.ai_mood && <span className="text-white/70 text-xs">{MOOD_ICONS[item.ai_mood]}</span>}
        </div>
        <h2 className="text-white font-bold text-lg">{item.title}</h2>
        <p className="text-gray-300 text-xs">{item.creator_username} · {formatDuration(item.duration_sec)}</p>
      </div>
      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-2 right-4 flex gap-1">
          {items.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === current ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Feed ──

export default function VODFeed({ userId }: { userId: string }) {
  const [videos, setVideos] = useState<VODItem[]>([]);
  const [featured, setFeatured] = useState<VODItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => p + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // ── Fetch feed ──
  const fetchFeed = useCallback(async (pageNum: number, reset = false) => {
    if (reset) setLoading(true);

    const category = activeCategory === 'all' ? null : activeCategory;

    const { data, error } = await supabase.rpc('get_personalized_feed', {
      p_user_id: userId,
      p_limit: 20,
      p_offset: pageNum * 20,
      p_category: category,
      p_mood: null,
    });

    if (error) {
      console.error('Feed error:', error);
      return;
    }

    if (data) {
      // Enrich with creator info
      const creatorIds = [...new Set(data.map((v: VODItem) => v.creator_id))];
      const { data: creators } = await supabase
        .from('rtv_users')
        .select('id, username, avatar_url, loyalty_tier')
        .in('id', creatorIds);

      const creatorMap = Object.fromEntries(
        (creators || []).map((c: any) => [c.id, c])
      );

      const enriched = data.map((v: VODItem) => ({
        ...v,
        creator_username: creatorMap[v.creator_id]?.username || 'Unknown',
        creator_avatar: creatorMap[v.creator_id]?.avatar_url,
        creator_tier: creatorMap[v.creator_id]?.loyalty_tier,
      }));

      if (reset) {
        setVideos(enriched);
        setFeatured(enriched.filter((v: VODItem) => v.is_featured).slice(0, 5));
      } else {
        setVideos(prev => [...prev, ...enriched]);
      }
      setHasMore(data.length === 20);
    }
    setLoading(false);
  }, [userId, activeCategory]);

  // ── Track impression ──
  const trackImpression = useCallback(async (vodId: string, position: number) => {
    await supabase.from('feed_interactions').insert({
      user_id: userId,
      vod_id: vodId,
      action: 'impression',
      position_in_feed: position,
    });
  }, [userId]);

  // ── Effects ──
  useEffect(() => { fetchFeed(0, true); }, [fetchFeed]);
  useEffect(() => {
    if (page > 0) fetchFeed(page);
  }, [page, fetchFeed]);

  // ── Category change ──
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(0);
    setVideos([]);
    setHasMore(true);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* ── Category Tabs ── */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                ${activeCategory === cat.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Banner ── */}
      {featured.length > 0 && activeCategory === 'all' && (
        <div className="px-3 pt-3">
          <FeaturedBanner items={featured} />
        </div>
      )}

      {/* ── Video Grid ── */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-2 gap-3">
          {videos.map((item, i) => (
            <div
              key={item.id}
              ref={i === videos.length - 1 ? lastItemRef : null}
              onClick={() => trackImpression(item.id, i)}
            >
              <VODCard item={item} onClick={(id) => {
                // Navigate to VOD player — handled by parent router
                console.log('Play VOD:', id);
              }} />
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* End of feed */}
        {!hasMore && !loading && videos.length > 0 && (
          <div className="text-center text-gray-500 text-xs py-8">
            You've seen it all! Check back later for new content ✨
          </div>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📺</p>
            <p className="text-gray-400">No content yet</p>
            <p className="text-gray-600 text-sm mt-1">Go live to start building your library!</p>
          </div>
        )}
      </div>
    </div>
  );
}
