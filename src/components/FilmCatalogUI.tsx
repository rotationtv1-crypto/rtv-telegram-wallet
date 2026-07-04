// ============================================================
// FilmCatalogUI.tsx — Xfinity-style Streaming Catalog
// RotationTV Network — Cable-grade browsing experience
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ── Types ──

interface Film {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  genre: string;
  rating: string;
  runtime_min: number;
  resolution: string;
  poster_url?: string;
  thumbnail_url?: string;
  banner_url?: string;
  trailer_url?: string;
  is_free: boolean;
  is_premium: boolean;
  is_pay_per_view: boolean;
  price_rtv: number;
  rental_price_rtv: number;
  tribute_min_rtv: number;
  tribute_suggested_rtv: number;
  view_count: number;
  like_count: number;
  tribute_count: number;
  total_tributes_rtv: number;
  is_featured: boolean;
  is_trending: boolean;
  published_at: string;
  content_flags: string[];
}

interface PricingTier {
  id: string;
  tier_name: string;
  tier_slug: string;
  tier_level: number;
  description: string;
  monthly_price_rtv: number;
  monthly_price_usd: number;
  annual_price_rtv?: number;
  annual_price_usd?: number;
  max_resolution: string;
  max_streams: number;
  ad_free: boolean;
  early_access: boolean;
  exclusive_content: boolean;
  ai_content_credits: number;
  tribute_discount_pct: number;
  features: Array<{ icon: string; label: string; description: string }>;
  is_popular: boolean;
  badge_color: string;
}

// ── Genre Categories (Xfinity-style horizontal rows) ──

const GENRE_ROWS = [
  { id: 'featured', label: '⭐ Featured', icon: '⭐' },
  { id: 'trending', label: '🔥 Trending Now', icon: '🔥' },
  { id: 'new', label: '🆕 New Releases', icon: '🆕' },
  { id: 'drama', label: '🎭 Drama', icon: '🎭' },
  { id: 'thriller', label: '🔪 Thriller', icon: '🔪' },
  { id: 'comedy', label: '😂 Comedy', icon: '😂' },
  { id: 'sci-fi', label: '🚀 Sci-Fi', icon: '🚀' },
  { id: 'horror', label: '👻 Horror', icon: '👻' },
  { id: 'romance', label: '💕 Romance', icon: '💕' },
  { id: 'action', label: '💥 Action', icon: '💥' },
  { id: 'documentary', label: '📹 Documentary', icon: '📹' },
  { id: 'animation', label: '🎨 Animation', icon: '🎨' },
  { id: 'free', label: '🆓 Free to Watch', icon: '🆓' },
  { id: 'premium', label: '💎 Premium', icon: '💎' },
];

const RATING_COLORS: Record<string, string> = {
  'TV-Y': 'bg-green-500', 'TV-Y7': 'bg-green-600',
  'TV-G': 'bg-blue-500', 'TV-PG': 'bg-blue-600',
  'TV-14': 'bg-orange-500', 'TV-MA': 'bg-red-600',
  'R': 'bg-red-700', 'NC-17': 'bg-red-800',
};

// ── Film Card ──

function FilmCard({ film, onClick }: { film: Film; onClick: (f: Film) => void }) {
  return (
    <div
      className="relative group cursor-pointer flex-shrink-0 w-36 md:w-44"
      onClick={() => onClick(film)}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
        {film.poster_url ? (
          <img src={film.poster_url} alt={film.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-gray-900">
            <span className="text-3xl">🎬</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-end opacity-0 group-hover:opacity-100">
          <div className="p-2 w-full">
            <p className="text-white text-xs font-bold truncate">{film.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`${RATING_COLORS[film.rating] || 'bg-gray-600'} text-white text-[8px] px-1 py-0.5 rounded font-bold`}>
                {film.rating}
              </span>
              <span className="text-gray-300 text-[10px]">{film.runtime_min}m</span>
              {film.is_free && <span className="text-green-400 text-[10px]">FREE</span>}
              {film.is_premium && <span className="text-yellow-400 text-[10px]">💎</span>}
            </div>
          </div>
        </div>

        {/* Badges */}
        {film.is_featured && (
          <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[8px] px-1.5 py-0.5 rounded font-bold">⭐</div>
        )}
        {film.is_trending && (
          <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold">🔥</div>
        )}
        {film.is_premium && !film.is_free && (
          <div className="absolute bottom-1 right-1 bg-purple-700/80 text-white text-[8px] px-1.5 py-0.5 rounded">💎 PREMIUM</div>
        )}
      </div>

      {/* Title below poster */}
      <p className="text-white text-xs font-semibold mt-1.5 truncate">{film.title}</p>
      <p className="text-gray-500 text-[10px]">{film.genre} · {film.runtime_min}m</p>
    </div>
  );
}

// ── Horizontal Scroll Row (Xfinity-style) ──

function GenreRow({ title, films, onFilmClick }: { title: string; films: Film[]; onFilmClick: (f: Film) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (!films.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="text-white font-bold text-sm">{title}</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll('left')} className="text-gray-400 hover:text-white text-lg">‹</button>
          <button onClick={() => scroll('right')} className="text-gray-400 hover:text-white text-lg">›</button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-4 scrollbar-hide pb-2">
        {films.map(film => (
          <FilmCard key={film.id} film={film} onClick={onFilmClick} />
        ))}
      </div>
    </div>
  );
}

// ── Pricing Card ──

function PricingCard({ tier, current, onSelect }: { tier: PricingTier; current: boolean; onSelect: (t: PricingTier) => void }) {
  return (
    <div className={`relative rounded-xl p-5 border-2 transition-all ${
      current ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20' :
      tier.is_popular ? 'border-yellow-500 bg-gray-900' : 'border-gray-700 bg-gray-900'
    }`}>
      {tier.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] px-3 py-1 rounded-full font-bold">
          MOST POPULAR
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-white font-bold text-lg">{tier.tier_name}</h3>
        <p className="text-gray-400 text-xs mt-1">{tier.description}</p>
      </div>

      <div className="text-center mb-4">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-white text-3xl font-bold">{tier.monthly_price_rtv}</span>
          <span className="text-purple-400 text-sm">RTV</span>
        </div>
        <p className="text-gray-500 text-xs">${tier.monthly_price_usd}/month</p>
        {tier.annual_price_rtv && (
          <p className="text-green-400 text-[10px] mt-1">
            Annual: {tier.annual_price_rtv} RTV (save {Math.round((1 - tier.annual_price_rtv! / (tier.monthly_price_rtv * 12)) * 100)}%)
          </p>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {tier.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-sm">{f.icon}</span>
            <div>
              <p className="text-white text-xs font-semibold">{f.label}</p>
              <p className="text-gray-500 text-[10px]">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSelect(tier)}
        className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${
          current ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white'
        }`}
      >
        {current ? 'Current Plan' : 'Subscribe'}
      </button>
    </div>
  );
}

// ── Main Catalog Component ──

export default function FilmCatalogUI({ userId }: { userId: string }) {
  const [films, setFilms] = useState<Film[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [showPricing, setShowPricing] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch catalog ──
  useEffect(() => {
    async function fetchCatalog() {
      const { data, error } = await supabase.rpc('get_catalog_by_tier', {
        p_user_id: userId,
        p_genre: null,
        p_rating: null,
        p_limit: 100,
        p_offset: 0,
      });

      if (!error && data) setFilms(data);

      // Fetch pricing tiers
      const { data: tierData } = await supabase
        .from('TributePricing')
        .select('*')
        .order('tier_level', { ascending: true });

      if (tierData) setTiers(tierData);

      // Fetch current subscription
      const { data: sub } = await supabase
        .from('UserSubscription')
        .select('tier_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (sub) {
        const tier = tierData?.find((t: PricingTier) => t.id === sub.tier_id);
        if (tier) setCurrentTier(tier.tier_slug);
      }

      setLoading(false);
    }
    fetchCatalog();
  }, [userId]);

  // ── Organize films into genre rows ──
  const genreRows = GENRE_ROWS.map(row => {
    let rowFilms: Film[];
    switch (row.id) {
      case 'featured':
        rowFilms = films.filter(f => f.is_featured);
        break;
      case 'trending':
        rowFilms = films.filter(f => f.is_trending);
        break;
      case 'new':
        rowFilms = [...films].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()).slice(0, 20);
        break;
      case 'free':
        rowFilms = films.filter(f => f.is_free);
        break;
      case 'premium':
        rowFilms = films.filter(f => f.is_premium);
        break;
      default:
        rowFilms = films.filter(f => f.genre.toLowerCase() === row.id);
    }
    return { ...row, films: rowFilms };
  }).filter(row => row.films.length > 0);

  // ── Film Detail Modal ──
  const FilmDetail = ({ film, onClose }: { film: Film; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-br from-purple-900 to-gray-900">
          {film.banner_url && <img src={film.banner_url} alt="" className="w-full h-full object-cover" />}
          <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl">✕</button>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900">
            <h2 className="text-white font-bold text-xl">{film.title}</h2>
            {film.subtitle && <p className="text-gray-400 text-sm">{film.subtitle}</p>}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`${RATING_COLORS[film.rating] || 'bg-gray-600'} text-white text-xs px-2 py-0.5 rounded font-bold`}>
              {film.rating}
            </span>
            <span className="text-gray-400 text-xs">{film.genre}</span>
            <span className="text-gray-400 text-xs">{film.runtime_min} min</span>
            <span className="text-gray-400 text-xs">{film.resolution}</span>
          </div>

          <p className="text-gray-300 text-sm mb-4">{film.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <span>👁 {film.view_count}</span>
            <span>❤️ {film.like_count}</span>
            <span>💰 {film.tribute_count} tributes ({film.total_tributes_rtv} RTV)</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {film.is_free ? (
              <button className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-purple-500">
                ▶ Watch Free
              </button>
            ) : film.is_premium && currentTier !== 'premium' && currentTier !== 'platinum' ? (
              <button
                onClick={() => { setShowPricing(true); onClose(); }}
                className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-yellow-500"
              >
                💎 Upgrade to Watch
              </button>
            ) : film.is_pay_per_view ? (
              <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-green-500">
                🎬 Rent for {film.rental_price_rtv} RTV
              </button>
            ) : (
              <button className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-purple-500">
                ▶ Watch Now
              </button>
            )}

            <button className="bg-gray-700 text-white px-4 py-3 rounded-lg text-sm hover:bg-gray-600">
              🪙 Tribute
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-white font-bold text-lg">🎬 RotationTV</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPricing(true)}
              className="text-purple-400 text-xs font-semibold hover:text-purple-300"
            >
              {currentTier === 'free' ? 'Upgrade' : `${currentTier.toUpperCase()} Plan`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      {films.filter(f => f.is_featured).length > 0 && (
        <div className="relative h-56 bg-gradient-to-r from-purple-900 via-gray-900 to-black overflow-hidden">
          <img
            src={films.find(f => f.is_featured)?.banner_url || films.find(f => f.is_featured)?.poster_url || ''}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="relative z-10 flex flex-col items-start justify-end h-full p-6">
            <span className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-full font-bold mb-2">⭐ FEATURED</span>
            <h2 className="text-white font-bold text-2xl mb-1">{films.find(f => f.is_featured)?.title}</h2>
            <p className="text-gray-300 text-sm mb-3">{films.find(f => f.is_featured)?.description?.slice(0, 100)}</p>
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-purple-500">
              ▶ Watch Now
            </button>
          </div>
        </div>
      )}

      {/* ── Genre Rows ── */}
      <div className="pt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          genreRows.map(row => (
            <GenreRow key={row.id} title={row.label} films={row.films} onFilmClick={setSelectedFilm} />
          ))
        )}
      </div>

      {/* ── Film Detail Modal ── */}
      {selectedFilm && (
        <FilmDetail film={selectedFilm} onClose={() => setSelectedFilm(null)} />
      )}

      {/* ── Pricing Modal ── */}
      {showPricing && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowPricing(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">Choose Your Plan</h2>
              <button onClick={() => setShowPricing(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map(tier => (
                <PricingCard
                  key={tier.id}
                  tier={tier}
                  current={tier.tier_slug === currentTier}
                  onSelect={(t) => {
                    setCurrentTier(t.tier_slug);
                    setShowPricing(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
