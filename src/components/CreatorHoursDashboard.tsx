// ============================================================
// CreatorHoursDashboard.tsx
// RotationTV Network — Bigo Live-style Hours & Tears Dashboard
// Real-time Supabase subscriptions + Cloudflare Stream integration
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ── Types ──

interface MonthlySummary {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  loyalty_tier: string;
  reputation_tier: string;
  followers_count: number;
  monthly_streams: number;
  monthly_hours: number;
  monthly_hours_display: number;
  peak_viewers: number;
  monthly_tears_rtv: number;
  monthly_tears_usd: number;
  monthly_tip_count: number;
  monthly_unique_tippers: number;
  net_earnings_rtv: number;
  net_earnings_usd: number;
  platform_fee_rtv: number;
  agency_fee_rtv: number;
  active_subscribers: number;
  subscription_revenue_rtv: number;
  tear_rank: number;
  hours_rank: number;
  total_monthly_revenue_rtv: number;
  current_period: string;
}

interface DailyHour {
  stream_date: string;
  hours_streamed: number;
  tears_rtv: number;
  total_viewers: number;
  peak_viewers: number;
  streams_that_day: number;
}

interface HourRate {
  total_hours: number;
  total_tears_rtv: number;
  total_tears_usd: number;
  tears_per_hour_rtv: number;
  tears_per_hour_usd: number;
  net_per_hour_rtv: number;
  net_per_hour_usd: number;
}

// ── Tier Badge Component ──

const TIER_COLORS: Record<string, string> = {
  none: 'bg-gray-600',
  bronze: 'bg-amber-700',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-cyan-400',
  diamond: 'bg-blue-500',
};

const TIER_ICONS: Record<string, string> = {
  none: '⚪', bronze: '🥉', silver: '🥈', gold: '🥇',
  platinum: '💎', diamond: '💠',
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`${TIER_COLORS[tier] || 'bg-gray-600'} text-white text-xs px-2 py-0.5 rounded-full font-bold`}>
      {TIER_ICONS[tier] || '⚪'} {tier?.charAt(0).toUpperCase()}{tier?.slice(1)}
    </span>
  );
}

// ── Stat Card Component ──

function StatCard({ label, value, unit, subtext, color = 'text-white' }: {
  label: string; value: string | number; unit?: string;
  subtext?: string; color?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-sm ml-1 text-gray-400">{unit}</span>}
      </p>
      {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
    </div>
  );
}

// ── Mini Bar Chart (7-day) ──

function WeeklyBarChart({ data }: { data: DailyHour[] }) {
  const last7 = data.slice(0, 7).reverse();
  const maxHours = Math.max(...last7.map(d => d.hours_streamed), 1);

  return (
    <div className="flex items-end gap-1 h-24">
      {last7.map((d, i) => {
        const h = (d.hours_streamed / maxHours) * 100;
        const dayLabel = new Date(d.stream_date).toLocaleDateString('en', { weekday: 'short' });
        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="relative w-full">
              <div
                className="w-full bg-gradient-to-t from-pink-600 to-purple-500 rounded-t-sm transition-all duration-500"
                style={{ height: `${Math.max(h, 4)}%`, minHeight: '4px' }}
              />
            </div>
            <span className="text-gray-500 text-[10px] mt-1">{dayLabel}</span>
            <span className="text-gray-400 text-[9px]">{d.hours_streamed.toFixed(1)}h</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Earnings Estimate Calculator ──

function EarningsCalculator({ rate }: { rate: HourRate | null }) {
  const [targetHours, setTargetHours] = useState(40);

  if (!rate || rate.tears_per_hour_rtv === 0) return null;

  const estimated = {
    tears: targetHours * rate.tears_per_hour_rtv,
    net: targetHours * rate.net_per_hour_rtv,
    usd: targetHours * rate.net_per_hour_usd,
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-bold text-sm mb-3">💰 Earnings Estimate</h3>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="range"
          min={5} max={200} step={5}
          value={targetHours}
          onChange={e => setTargetHours(Number(e.target.value))}
          className="flex-1 accent-pink-500"
        />
        <span className="text-white font-mono text-lg w-12 text-right">{targetHours}h</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-pink-400 text-lg font-bold">{estimated.tears.toLocaleString()}</p>
          <p className="text-gray-500 text-[10px]">Tears (RTV)</p>
        </div>
        <div>
          <p className="text-green-400 text-lg font-bold">{estimated.net.toLocaleString()}</p>
          <p className="text-gray-500 text-[10px]">Net (RTV)</p>
        </div>
        <div>
          <p className="text-yellow-400 text-lg font-bold">${estimated.usd.toFixed(2)}</p>
          <p className="text-gray-500 text-[10px]">Net (USD)</p>
        </div>
      </div>
      <p className="text-gray-600 text-[10px] mt-2">
        Based on {rate.tears_per_hour_rtv} tears/hour average
      </p>
    </div>
  );
}

// ── Main Dashboard ──

export default function CreatorHoursDashboard({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [dailyHours, setDailyHours] = useState<DailyHour[]>([]);
  const [hourRate, setHourRate] = useState<HourRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'hours' | 'tears' | 'earnings'>('overview');

  // ── Fetch data ──
  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    const [summaryRes, dailyRes, rateRes] = await Promise.all([
      supabase.from('creator_monthly_summary').select('*').eq('user_id', userId).single(),
      supabase.from('creator_daily_hours').select('*').eq('creator_id', userId).order('stream_date', { ascending: false }).limit(30),
      supabase.from('creator_hour_rate').select('*').eq('creator_id', userId).single(),
    ]);

    if (summaryRes.data) setSummary(summaryRes.data);
    if (dailyRes.data) setDailyHours(dailyRes.data);
    if (rateRes.data) setHourRate(rateRes.data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Real-time subscription for live stream updates ──
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_streams',
        filter: `creator_id=eq.${userId}`,
      }, () => { fetchDashboard(); })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_tips',
      }, () => { fetchDashboard(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-4xl mb-2">📺</p>
        <p>No streaming data yet this month</p>
        <p className="text-sm text-gray-600">Go live to start tracking your hours and tears!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 p-4">
        <div className="flex items-center gap-3">
          <img
            src={summary.avatar_url || '/default-avatar.png'}
            alt={summary.display_name}
            className="w-14 h-14 rounded-full border-2 border-white/30"
          />
          <div className="flex-1">
            <h1 className="text-lg font-bold">{summary.display_name || summary.username}</h1>
            <div className="flex items-center gap-2 mt-1">
              <TierBadge tier={summary.loyalty_tier} />
              <span className="text-gray-300 text-xs">#{summary.tear_rank} Tears</span>
              <span className="text-gray-300 text-xs">#{summary.hours_rank} Hours</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-300">{summary.current_period}</p>
            <p className="text-xs text-gray-400">{summary.followers_count.toLocaleString()} followers</p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
        {(['overview', 'hours', 'tears', 'earnings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors
              ${activeTab === tab
                ? 'text-pink-400 border-b-2 border-pink-500'
                : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Monthly Hours"
              value={summary.monthly_hours_display}
              unit="hrs"
              subtext={`${summary.monthly_streams} streams`}
              color="text-cyan-400"
            />
            <StatCard
              label="Monthly Tears"
              value={summary.monthly_tears_rtv}
              unit="RTV"
              subtext={`≈ $${summary.monthly_tears_usd.toFixed(2)} USD`}
              color="text-pink-400"
            />
            <StatCard
              label="Peak Viewers"
              value={summary.peak_viewers}
              subtext={`${summary.monthly_unique_tippers} unique tippers`}
              color="text-yellow-400"
            />
            <StatCard
              label="Net Earnings"
              value={summary.net_earnings_rtv}
              unit="RTV"
              subtext={`≈ $${summary.net_earnings_usd.toFixed(2)} USD`}
              color="text-green-400"
            />
          </div>

          {/* Weekly chart */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-bold text-sm mb-3">📊 Last 7 Days</h3>
            <WeeklyBarChart data={dailyHours} />
          </div>

          {/* Earnings calculator */}
          <EarningsCalculator rate={hourRate} />
        </div>
      )}

      {/* ── Hours Tab ── */}
      {activeTab === 'hours' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="This Month" value={summary.monthly_hours_display} unit="hrs" color="text-cyan-400" />
            <StatCard label="Total Streams" value={summary.monthly_streams} color="text-blue-400" />
            <StatCard label="Hours Rank" value={`#${summary.hours_rank}`} color="text-purple-400" />
            <StatCard label="Peak Viewers" value={summary.peak_viewers} color="text-yellow-400" />
          </div>

          {/* Daily breakdown */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-bold text-sm mb-3">📅 Daily Breakdown</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dailyHours.slice(0, 14).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/50">
                  <div>
                    <p className="text-white text-sm">
                      {new Date(d.stream_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-gray-500 text-xs">{d.streams_that_day} stream{d.streams_that_day !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-400 font-mono text-sm">{d.hours_streamed.toFixed(1)}h</p>
                    <p className="text-gray-500 text-xs">↑{d.peak_viewers} peak</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 30-day chart */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-bold text-sm mb-3">📈 30-Day Hours</h3>
            <WeeklyBarChart data={dailyHours} />
          </div>
        </div>
      )}

      {/* ── Tears Tab ── */}
      {activeTab === 'tears' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Tears This Month" value={summary.monthly_tears_rtv} unit="RTV" color="text-pink-400" />
            <StatCard label="Tears USD" value={`$${summary.monthly_tears_usd.toFixed(2)}`} color="text-green-400" />
            <StatCard label="Tip Count" value={summary.monthly_tip_count} color="text-yellow-400" />
            <StatCard label="Unique Tippers" value={summary.monthly_unique_tippers} color="text-purple-400" />
            <StatCard label="Tear Rank" value={`#${summary.tear_rank}`} color="text-pink-400" />
            <StatCard
              label="Avg per Tip"
              value={summary.monthly_tip_count > 0
                ? Math.round(summary.monthly_tears_rtv / summary.monthly_tip_count)
                : 0}
              unit="RTV"
              color="text-orange-400"
            />
          </div>

          {/* Tears per day chart */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-bold text-sm mb-3">💝 Daily Tears</h3>
            <div className="flex items-end gap-1 h-24">
              {dailyHours.slice(0, 14).reverse().map((d, i) => {
                const maxTears = Math.max(...dailyHours.slice(0, 14).map(x => x.tears_rtv), 1);
                const h = (d.tears_rtv / maxTears) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-pink-600 to-rose-400 rounded-t-sm"
                      style={{ height: `${Math.max(h, 2)}%`, minHeight: '2px' }}
                    />
                    <span className="text-gray-500 text-[9px]">
                      {d.tears_rtv > 0 ? d.tears_rtv.toLocaleString() : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Earnings Tab ── */}
      {activeTab === 'earnings' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Net Earnings" value={summary.net_earnings_rtv} unit="RTV" color="text-green-400" />
            <StatCard label="Net USD" value={`$${summary.net_earnings_usd.toFixed(2)}`} color="text-green-400" />
            <StatCard label="Platform Fee" value={summary.platform_fee_rtv} unit="RTV (15%)" color="text-red-400" />
            <StatCard label="Agency Fee" value={summary.agency_fee_rtv} unit="RTV" color="text-orange-400" />
            <StatCard label="Sub Revenue" value={summary.subscription_revenue_rtv} unit="RTV" color="text-blue-400" />
            <StatCard label="Active Subs" value={summary.active_subscribers} color="text-purple-400" />
          </div>

          {/* Revenue split visualization */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-bold text-sm mb-3">📊 Revenue Split</h3>
            <div className="flex h-8 rounded-full overflow-hidden">
              <div className="bg-green-500 flex items-center justify-center text-[10px] font-bold" style={{ width: '80%' }}>
                Creator 80%
              </div>
              <div className="bg-red-500 flex items-center justify-center text-[10px] font-bold" style={{ width: '15%' }}>
                15%
              </div>
              <div className="bg-orange-500 flex items-center justify-center text-[10px] font-bold" style={{ width: '5%' }}>
                5%
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
              <span>You: {summary.net_earnings_rtv.toLocaleString()} RTV</span>
              <span>Platform: {summary.platform_fee_rtv.toLocaleString()} RTV</span>
              <span>Agency: {summary.agency_fee_rtv.toLocaleString()} RTV</span>
            </div>
          </div>

          <EarningsCalculator rate={hourRate} />
        </div>
      )}
    </div>
  );
}
