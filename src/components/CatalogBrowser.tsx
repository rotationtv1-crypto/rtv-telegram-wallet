// ============================================================
// CatalogBrowser.tsx — Xfinity-style VOD Catalog
// RotationTV Network — Channel lineup + film library
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ── Types ──

interface Channel {
  id: string; name: string; slug: string; description: string;
  logo_url: string; banner_url: string; category: string;
  tier: string; price_rtv_monthly: number; is_live: boolean;
  sort_order: number;
}

interface VodItem {
  id: string; title: string; description: string; synopsis: string;
  genre: string[]; rating: string; runtime_minutes: number;
  poster_url: string; backdrop_url: string; thumbnail_url: string;
  playback_url: string; trailer_url: string;
  access_tier: string; price_rtv: number; is_premium: boolean;
  is_exclusive: boolean; is_featured: boolean; is_trending: boolean;
  view_count: number; like_count: number;
  source_type: string; premiere_at: string; published_at: string;
  ai_mood: string; channel_id: string;
}

interface Plan {
  id: string; name: string; slug: string; description: string;
  tier: string; price_rtv_monthly: number; price_usd_monthly: number;
  max_resolution: string; ad_free: boolean; exclusive_content: boolean;
  ai_clone_access: boolean; creator_tools: boolean; trial_days: number;
  is_popular: boolean;
}

interface Tribute {
  id: string; name: string; slug: string; amount_rtv: number;
  amount_usd: number; emoji: string; display_color: string;
  is_animated: boolean;
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-600', basic: 'bg-blue-600', premium: 'bg-purple-600',
  vip: 'bg-amber-600', platinum: 'bg-gradient-to-r from-amber-500 to-yellow-300',
};

const TIER_LABELS: Record<string, string> = {
  free: 'FREE', basic: 'BASIC', premium: 'PREMIUM',
  vip: 'VIP', platinum: 'PLATINUM',
};

const RATING_COLORS: Record<string, string> = {
  'TV-Y': 'text-green-400', 'TV-G': 'text-green-400', 'TV-PG': 'text-yellow-400',
  'TV-14': 'text-orange-400', 'TV-MA': 'text-red-400', 'R': 'text-red-500',
};

// ── Channel Card ──

function ChannelCard({ channel, active, onClick }: { channel: Channel; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left
        ${active ? 'bg-pink-600/20 border border-pink-500' : 'bg-gray-900 border border-gray-800 hover:border-gray-600'}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${TIER_COLORS[channel.tier]}`}>
        {channel.is_live ? '🔴' : '📺'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold truncate">{channel.name}</div>
        <div className="text-gray-400 text-xs truncate">{channel.description}</div>
      </div>
      <div className="text-right">
        {channel.price_rtv_monthly > 0 ? (
          <div className="text-pink-400 text-xs font-bold">{channel.price_rtv_monthly} RTV/mo</div>
        ) : (
          <div className="text-green-400 text-xs font-bold">FREE</div>
        )}
        <div className={`text-[10px] font-bold ${TIER_COLORS[channel.tier]} px-1.5 py-0.5 rounded`}>
          {TIER_LABELS[channel.tier]}
        </div>
      </div>
    </button>
  );
}

// ── VOD Card ──

function VodCard({ item, onClick }: { item: VodItem; onClick: (id: string) => void }) {
  return (
    <div
      className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 cursor-pointer hover:border-gray-600 transition-all hover:scale-[1.02]"
      onClick={() => onClick(item.id)}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-gray-800">
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-b from-gray-800 to-gray-900">
            🎬
          </div>
        )}

        {/* Rating badge */}
        <div className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 ${RATING_COLORS[item.rating] || 'text-gray-400'}`}>
          {item.rating}
        </div>

        {/* Tier badge */}
        <div className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${TIER_COLORS[item.access_tier]}`}>
          {TIER_LABELS[item.access_tier]}
        </div>

        {/* Trending */}
        {item.is_trending && (
          <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            🔥 TRENDING
          </div>
        )}

        {/* Exclusive */}
        {item.is_exclusive && (
          <div className="absolute bottom-2 right-2 bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full">
            ✨ EXCLUSIVE
          </div>
        )}

        {/* Runtime */}
        <div className="absolute bottom-10 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          {item.runtime_minutes}m
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white text-sm font-bold line-clamp-1">{item.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-400 text-xs">{item.genre?.[0] || 'Film'}</span>
          <span className="text-gray-600 text-xs">·</span>
          <span className="text-gray-500 text-xs">👁 {item.view_count > 1000 ? `${(item.view_count / 1000).toFixed(1)}K` : item.view_count}</span>
        </div>
        {item.price_rtv > 0 && (
          <div className="text-pink-400 text-xs font-bold mt-1">💎 {item.price_rtv} RTV</div>
        )}
      </div>
    </div>
  );
}

// ── Plan Card ──

function PlanCard({ plan, current, onSelect }: { plan: Plan; current: boolean; onSelect: () => void }) {
  return (
    <div className={`rounded-xl p-4 border transition-all
      ${current ? 'bg-pink-600/10 border-pink-500 ring-2 ring-pink-500' : 'bg-gray-900 border-gray-800 hover:border-gray-600'}
      ${plan.is_popular ? 'relative' : ''}`}>

      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
          MOST POPULAR
        </div>
      )}

      <div className={`text-center mb-3 ${TIER_COLORS[plan.tier]} text-white text-xs font-bold py-1 rounded`}>
        {plan.name.toUpperCase()}
      </div>

      <div className="text-center mb-4">
        <div className="text-white text-2xl font-bold">
          {plan.price_usd_monthly > 0 ? `$${plan.price_usd_monthly}` : 'FREE'}
        </div>
        <div className="text-gray-400 text-xs">/month</div>
        {plan.price_rtv_monthly > 0 && (
          <div className="text-pink-400 text-xs mt-1">or {plan.price_rtv_monthly} RTV</div>
        )}
      </div>

      <ul className="space-y-2 text-xs">
        <li className="flex items-center gap-2 text-gray-300">
          <span className="text-green-400">✓</span> {plan.max_streams} stream{plan.max_streams > 1 ? 's' : ''}
        </li>
        <li className="flex items-center gap-2 text-gray-300">
          <span className="text-green-400">✓</span> {plan.max_resolution}
        </li>
        <li className="flex items-center gap-2 text-gray-300">
          <span className="text-green-400">✓</span> {plan.concurrent_devices} device{plan.concurrent_devices > 1 ? 's' : ''}
        </li>
        {plan.ad_free && <li className="flex items-center gap-2 text-white"><span className="text-green-400">✓</span> Ad-free</li>}
        {plan.exclusive_content && <li className="flex items-center gap-2 text-white"><span className="text-green-400">✓</span> Exclusive content</li>}
        {plan.ai_clone_access && <li className="flex items-center gap-2 text-white"><span className="text-green-400">✓</span> AI clone access</li>}
        {plan.creator_tools && <li className="flex items-center gap-2 text-white"><span className="text-green-400">✓</span> Creator tools</li>}
        {plan.trial_days > 0 && <li className="text-pink-400 font-semibold">{plan.trial_days}-day free trial</li>}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full mt-4 py-2 rounded-lg text-sm font-bold transition-colors
          ${current ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
      >
        {current ? 'Current Plan' : plan.price_usd_monthly > 0 ? 'Subscribe' : 'Get Started'}
      </button>
    </div>
  );
}

// ── Tribute Bar ──

function TributeBar({ tributes, onTribute }: { tributes: Tribute[]; onTribute: (t: Tribute) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
      {tributes.map(t => (
        <button
          key={t.id}
          onClick={() => onTribute(t)}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 transition-all min-w-[64px]"
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className="text-white text-xs font-bold">{t.amount_rtv}</span>
          <span className="text-gray-500 text-[10px]">RTV</span>
        </button>
      ))}
    </div>
  );
}

// ── Main Catalog Browser ──

export default function CatalogBrowser({ userId }: { userId: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'plans' | 'tributes'>('browse');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('CatalogChannel').select('*').eq('status', 'active').order('sort_order'),
      supabase.from('SubscriptionPlan').select('*').eq('status', 'active').order('sort_order'),
      supabase.from('TributeTier').select('*').eq('status', 'active').order('sort_order'),
    ]).then(([chRes, planRes, tribRes]) => {
      setChannels(chRes.data || []);
      setPlans(planRes.data || []);
      setTributes(tribRes.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let query = supabase.from('CatalogVod').select('*').eq('status', 'ready').order('published_at', { ascending: false }).limit(40);
    if (activeChannel) query = query.eq('channel_id', activeChannel);
    query.then(({ data }) => setVideos(data || []));
  }, [activeChannel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">RotationTV</h1>
            <p className="text-gray-400 text-xs">Cable-grade streaming on Telegram</p>
          </div>
          <div className="flex gap-2">
            {['browse', 'plans', 'tributes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                  ${activeTab === tab ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {tab === 'browse' ? '📺 Browse' : tab === 'plans' ? '💎 Plans' : '🎁 Tributes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Browse Tab ── */}
      {activeTab === 'browse' && (
        <div className="flex">
          {/* Channel sidebar */}
          <div className="w-56 border-r border-gray-800 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)] hidden md:block">
            <button
              onClick={() => setActiveChannel(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                ${!activeChannel ? 'bg-pink-600/20 text-pink-400' : 'text-gray-400 hover:bg-gray-900'}`}
            >
              ✨ All Channels
            </button>
            {channels.map(ch => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                active={activeChannel === ch.id}
                onClick={() => setActiveChannel(ch.id)}
              />
            ))}
          </div>

          {/* Content grid */}
          <div className="flex-1 p-4">
            {/* Featured row */}
            {videos.filter(v => v.is_featured).length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-300 mb-3">⭐ FEATURED</h2>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {videos.filter(v => v.is_featured).map(v => (
                    <div key={v.id} className="min-w-[200px]">
                      <div className="relative h-28 rounded-lg overflow-hidden">
                        <img src={v.backdrop_url || v.poster_url} alt={v.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-3">
                          <div className="text-white text-sm font-bold">{v.title}</div>
                          <div className="text-gray-300 text-xs">{v.runtime_minutes}m · {v.genre?.[0]}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VOD grid */}
            <h2 className="text-sm font-bold text-gray-300 mb-3">
              {activeChannel ? channels.find(c => c.id === activeChannel)?.name || 'Content' : '🎬 ALL CONTENT'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {videos.map(v => (
                <VodCard key={v.id} item={v} onClick={(id) => console.log('Play:', id)} />
              ))}
            </div>

            {videos.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-3xl mb-2">🎬</p>
                <p>No content yet. Start streaming to build the library!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Plans Tab ── */}
      {activeTab === 'plans' && (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-1">Choose Your Plan</h2>
          <p className="text-gray-400 text-sm mb-6">Unlock more content, higher quality, and exclusive features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {plans.map(p => (
              <PlanCard key={p.id} plan={p} current={false} onSelect={() => console.log('Select plan:', p.slug)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Tributes Tab ── */}
      {activeTab === 'tributes' && (
        <div className="p-4">
          <h2 className="text-lg font-bold mb-1">Tribute Tiers</h2>
          <p className="text-gray-400 text-sm mb-6">Support creators during streams and films</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {tributes.map(t => (
              <div key={t.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <div className="text-4xl mb-2">{t.emoji}</div>
                <div className="text-white font-bold">{t.name}</div>
                <div className="text-pink-400 text-lg font-bold">{t.amount_rtv} RTV</div>
                <div className="text-gray-500 text-xs">${t.amount_usd.toFixed(2)}</div>
                <div className="w-full h-1 rounded-full mt-3" style={{ backgroundColor: t.display_color }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
