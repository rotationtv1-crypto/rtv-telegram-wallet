import OwnerGate from "./OwnerGate";
import { useState } from "react";

const tiers = [
  {
    id: 1,
    icon: "🎯",
    title: "Brand Position",
    subtitle: "The Unfair Advantage",
    color: "from-orange-500 to-red-600",
    content: [
      { label: "Core Identity", value: "The ONLY ecosystem combining blockchain payments + AI creator tools + enterprise voice + on-chain education + justice tech + logistics + creative agency + build infrastructure." },
      { label: "Positioning", value: "While others build apps, we built an ecosystem. While others talk Web3, we run it." },
      { label: "Motto", value: "Learn it. Live it. Love it. — We keep business rotating globally." },
      { label: "Category", value: "We don't compete. We operate in our own category." },
    ]
  },
  {
    id: 2,
    icon: "📱",
    title: "Content Machine",
    subtitle: "Daily God Mode Cadence",
    color: "from-blue-500 to-cyan-600",
    content: [
      { label: "TikTok / Reels / Shorts", value: "3x daily — 7am Market Move | 12pm Build in Public | 7pm Learn It tip" },
      { label: "X (Twitter)", value: "5x daily — CEO quote | ecosystem stat | video clip | industry take | community reply" },
      { label: "LinkedIn", value: "2x daily — thought leadership + case study" },
      { label: "YouTube Long Form", value: "2x/week — ecosystem walkthroughs + RTV University curriculum previews" },
    ]
  },
  {
    id: 3,
    icon: "🎬",
    title: "HeyGen Video Army",
    subtitle: "9 Videos × Every Platform",
    color: "from-purple-500 to-pink-600",
    content: [
      { label: "Videos Live", value: "RotationTV Network • RotationPay • RotationCall • RTV AI University • Bigo Agency • EmergentLabs • White Logistics • Pretrial Services • Ecosystem Overview" },
      { label: "Platforms", value: "TikTok • Instagram Reels • YouTube Shorts • LinkedIn • X/Twitter • Discord • Telegram" },
      { label: "Hook Formula", value: "Line 1: Bold statement | Line 2: Pain point solved | Line 3: CTA to rotationtvai.com" },
      { label: "Avatar Diversity", value: "Marcus (Black male) • Adriana (Latina) • Abigail (female) • Noah (male) • Elenora • Bryan • Brandon • Milena • Caroline" },
    ]
  },
  {
    id: 4,
    icon: "📊",
    title: "Growth Channels",
    subtitle: "Ranked by ROI for RTV",
    color: "from-green-500 to-emerald-600",
    content: [
      { label: "#1 TikTok", value: "Crypto/AI/Web3 #1 growth platform 2026 — #Web3 #AItools #SolanaToken #CreatorEconomy" },
      { label: "#2 YouTube Shorts", value: "Educational RTV University clips perform best" },
      { label: "#3 Crypto Twitter (X)", value: "KOL partnerships + thread campaigns + Spaces hosting" },
      { label: "#4 LinkedIn", value: "B2B enterprise for RotationCall + White Logistics — CEO thought leadership" },
    ]
  },
  {
    id: 5,
    icon: "🤝",
    title: "KOL & Influencer",
    subtitle: "Partner Network Strategy",
    color: "from-yellow-500 to-orange-600",
    content: [
      { label: "Tier 1 — Crypto Twitter KOLs", value: "100K+ followers | Pay in $RTV + equity | 1 thread + 1 Space" },
      { label: "Tier 2 — YouTube Educators", value: "50K-500K | Sponsor video + HeyGen b-roll provided" },
      { label: "Tier 3 — TikTok AI/Tech", value: "10K-100K | RTV Affiliate Program — earn $RTV per referral (highest ROI)" },
      { label: "Tier 4 — LinkedIn Leaders", value: "Co-author posts | target entrepreneurs + startup founders" },
    ]
  },
  {
    id: 6,
    icon: "🏘️",
    title: "Community Stack",
    subtitle: "Own Your Audience",
    color: "from-teal-500 to-cyan-600",
    content: [
      { label: "Email List", value: "Lead magnet: Free RTV AI University Intro Course | Goal: 10,000 subs in 90 days" },
      { label: "Discord Server", value: "#rtv-token #nft-drops #university #rotationcall #rotationpay | $RTV airdrops for active members" },
      { label: "Telegram", value: "Daily ecosystem updates + flash announcements for token events" },
      { label: "Newsletter", value: "'Rotation Report' — every Monday 8am ET | ecosystem updates + market insights" },
    ]
  },
  {
    id: 7,
    icon: "🪙",
    title: "$RTV Token Marketing",
    subtitle: "Web3 Growth Flywheel",
    color: "from-amber-500 to-yellow-600",
    content: [
      { label: "Phase 1 — Awareness", value: "CoinGecko + CoinMarketCap listing | Solana ecosystem directories | Solana Foundation grant" },
      { label: "Phase 2 — Community", value: "RTV DAO governance | NFT diploma staking rewards | 2% RotationPay cashback in $RTV | referral program" },
      { label: "Phase 3 — Exchange", value: "Jupiter DEX → Raydium → MEXC → Gate.io listing progression" },
      { label: "Token Utility", value: "Pay for RTV University | Governance votes | RotationPay cashback | NFT minting | staking rewards" },
    ]
  },
  {
    id: 8,
    icon: "💰",
    title: "Paid Ads Strategy",
    subtitle: "Budget God Mode Allocation",
    color: "from-rose-500 to-pink-600",
    content: [
      { label: "Meta (FB/IG) — 30%", value: "Retargeting + lookalike audiences from rotationtvai.com visitors" },
      { label: "TikTok Ads — 25%", value: "Top of funnel awareness — HeyGen videos as primary creative" },
      { label: "Google Ads — 20%", value: "Intent-based — 'AI creator platform' 'Solana payments' 'Web3 education'" },
      { label: "YouTube + LinkedIn — 25%", value: "Pre-roll on crypto/AI content + B2B enterprise for RotationCall" },
    ]
  },
  {
    id: 9,
    icon: "📰",
    title: "PR & Media",
    subtitle: "Tier 1 Press Targets",
    color: "from-indigo-500 to-blue-600",
    content: [
      { label: "Crypto Press", value: "CoinDesk ($RTV story) • CoinTelegraph (RotationPay + Solana) • Decrypt (ecosystem launch)" },
      { label: "Tech Press", value: "TechCrunch (AI creator platform) • Forbes (Darrel CEO profile — presidential authority)" },
      { label: "Diversity Press", value: "Black Enterprise (Black-owned Web3) • Essence • Blavity — authentic story that resonates globally" },
      { label: "Press Releases", value: "1. Ecosystem launch | 2. $RTV token live | 3. RotationCall enterprise | 4. Funding announcement" },
    ]
  },
  {
    id: 10,
    icon: "🚀",
    title: "90-Day Execution",
    subtitle: "Domination Timeline",
    color: "from-violet-500 to-purple-600",
    content: [
      { label: "Days 1-30 — IGNITION", value: "Post 9 HeyGen videos everywhere | Launch Discord | Start daily content | List $RTV on CoinGecko | Email capture live | 20 influencer outreach" },
      { label: "Days 31-60 — AMPLIFICATION", value: "Paid ads live | 5 KOL deals signed | Jupiter DEX listing | RTV University first cohort | 1,000 Discord members" },
      { label: "Days 61-90 — DOMINATION", value: "MEXC listing | Forbes/TechCrunch feature | 10K email subs | 100 RotationPay merchants | $5M ecosystem TVL | NFT diplomas minting" },
      { label: "Competitive Moat", value: "9 companies + $RTV token + on-chain credentials + AI+Voice+Payments+Education — NO ONE can replicate this stack" },
    ]
  },
];

const videos = [
  { title: "RotationTV Network — Brand Launch", avatar: "Marcus", status: "processing", color: "bg-orange-500" },
  { title: "RotationPay — Payment Revolution", avatar: "Adriana", status: "processing", color: "bg-green-500" },
  { title: "RotationCall — AI Voice Platform", avatar: "Noah", status: "processing", color: "bg-blue-500" },
  { title: "RTV AI University — Learn The Future", avatar: "Abigail", status: "processing", color: "bg-purple-500" },
  { title: "Bigo Agency — Creative Power", avatar: "Elenora", status: "processing", color: "bg-yellow-500" },
  { title: "EmergentLabs — Build What's Next", avatar: "Bryan", status: "processing", color: "bg-cyan-500" },
  { title: "White Logistics — Move The World", avatar: "Brandon", status: "processing", color: "bg-slate-500" },
  { title: "Pretrial Services — Justice Tech", avatar: "Milena", status: "processing", color: "bg-red-500" },
  { title: "RTV Ecosystem — Full Overview", avatar: "Caroline", status: "processing", color: "bg-pink-500" },
];

function MarketingCommandCenterInner() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedTier, setExpandedTier] = useState(null);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-700 p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">⚡ RTV MARKETING COMMAND CENTER</h1>
              <p className="text-orange-200 mt-1 text-sm font-medium">QUANTUM PRECISION GOD MODE | Presidential Authority: Darrel</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-yellow-300">100/100</div>
              <div className="text-xs text-orange-200">ECOSYSTEM HEALTH</div>
            </div>
          </div>
          <p className="mt-3 text-white/80 text-sm italic">"Learn it. Live it. Love it. — We keep business rotating globally."</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="bg-[#111128] border-b border-white/10">
        <div className="max-w-7xl mx-auto flex gap-1 p-2">
          {["overview", "videos", "tiers", "90days"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "bg-orange-600 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab === "90days" ? "90-Day Plan" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Companies", value: "9", icon: "🏢", sub: "Full Ecosystem" },
                { label: "HeyGen Videos", value: "9", icon: "🎬", sub: "Rendering Now" },
                { label: "Platforms", value: "7+", icon: "📱", sub: "Every Channel" },
                { label: "Marketing Tiers", value: "10", icon: "⚡", sub: "God Mode Active" },
              ].map((s, i) => (
                <div key={i} className="bg-[#1a1a35] rounded-xl p-5 border border-white/10">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-3xl font-black text-orange-400">{s.value}</div>
                  <div className="text-white font-bold text-sm">{s.label}</div>
                  <div className="text-white/50 text-xs mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Positioning */}
            <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 rounded-xl p-6 border border-orange-500/30">
              <h2 className="text-xl font-black text-orange-400 mb-4">🎯 COMPETITIVE MOAT — NO ONE CAN REPLICATE THIS</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "9 companies, 1 unified ecosystem",
                  "$RTV token — financial incentive for every user action",
                  "On-chain NFT credentials — permanent real-world value",
                  "AI + Voice + Payments + Education — nobody has all 4",
                  "Black-owned, presidential-led — authentic global story",
                  "HeyGen video army — diverse avatars, every platform",
                  "Solana blockchain backbone — fastest chain, lowest fees",
                  "Quantum Precision AI Command Center — 24/7 automated",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-black/30 rounded-lg p-3">
                    <span className="text-green-400 font-black mt-0.5">✓</span>
                    <span className="text-white/90 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Priority */}
            <div className="bg-[#1a1a35] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-black text-white mb-4">📊 CHANNEL PRIORITY STACK (2026 ROI Rankings)</h2>
              <div className="space-y-3">
                {[
                  { rank: 1, channel: "TikTok", why: "#1 for crypto/AI/Web3 growth. 3x daily. HeyGen avatars dominate.", color: "bg-pink-600" },
                  { rank: 2, channel: "YouTube Shorts", why: "RTV University educational clips crush algorithm.", color: "bg-red-600" },
                  { rank: 3, channel: "X / Crypto Twitter", why: "KOL partnerships + thread campaigns + Spaces hosting.", color: "bg-sky-600" },
                  { rank: 4, channel: "LinkedIn", why: "B2B enterprise for RotationCall + White Logistics.", color: "bg-blue-700" },
                  { rank: 5, channel: "Discord", why: "Web3 DAO community — $RTV holders + NFT owners.", color: "bg-indigo-600" },
                  { rank: 6, channel: "Instagram Reels", why: "Visual brand presence + Reels for reach.", color: "bg-gradient-to-r from-purple-600 to-pink-600" },
                  { rank: 7, channel: "Reddit", why: "r/solana r/web3 r/AItools — organic trusted growth.", color: "bg-orange-700" },
                ].map((c) => (
                  <div key={c.rank} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                      {c.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.channel}</span>
                      </div>
                      <span className="text-white/60 text-xs">{c.why}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === "videos" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-black text-purple-300 mb-2">🎬 9 HeyGen Social Media Videos — RENDERING NOW</h2>
              <p className="text-white/60 text-sm">Diverse avatars. Professional scripts. Every platform. Status auto-updates every 15 minutes.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v, i) => (
                <div key={i} className="bg-[#1a1a35] rounded-xl border border-white/10 overflow-hidden">
                  <div className={`h-2 ${v.color}`} />
                  <div className="p-4">
                    <div className="font-bold text-white text-sm mb-1">{v.title}</div>
                    <div className="text-white/50 text-xs mb-3">Avatar: {v.avatar}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span className="text-yellow-400 text-xs font-semibold uppercase">Processing</span>
                    </div>
                    <div className="mt-3 text-xs text-white/40">
                      Distributing to: TikTok • Reels • YouTube Shorts • LinkedIn • X • Discord • Telegram
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#1a1a35] rounded-xl p-5 border border-white/10">
              <h3 className="font-black text-white mb-3">🎯 Video Hook Formula (for every caption)</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-black/40 rounded-lg p-3">
                  <span className="text-orange-400 font-bold">Line 1:</span> <span className="text-white/80">Bold statement (controversial or surprising fact)</span>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <span className="text-blue-400 font-bold">Line 2:</span> <span className="text-white/80">The pain point it solves</span>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <span className="text-green-400 font-bold">Line 3:</span> <span className="text-white/80">CTA → rotationtvai.com</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIERS TAB */}
        {activeTab === "tiers" && (
          <div className="space-y-3">
            <p className="text-white/60 text-sm mb-4">Click any tier to expand the full strategy details.</p>
            {tiers.map((tier) => (
              <div key={tier.id} className="bg-[#1a1a35] rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setExpandedTier(expandedTier === tier.id ? null : tier.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-all text-left"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl shrink-0`}>
                    {tier.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-white">TIER {tier.id} — {tier.title}</div>
                    <div className="text-white/50 text-xs">{tier.subtitle}</div>
                  </div>
                  <div className="text-white/40 text-xl">{expandedTier === tier.id ? "▲" : "▼"}</div>
                </button>
                {expandedTier === tier.id && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-4">
                    {tier.content.map((item, i) => (
                      <div key={i} className="bg-black/30 rounded-lg p-3">
                        <div className="text-orange-400 font-bold text-xs mb-1">{item.label}</div>
                        <div className="text-white/80 text-sm">{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 90 DAYS TAB */}
        {activeTab === "90days" && (
          <div className="space-y-6">
            {[
              {
                phase: "Days 1-30",
                label: "🔥 IGNITION",
                color: "from-red-600 to-orange-600",
                tasks: [
                  "Post all 9 HeyGen videos across TikTok, Reels, YouTube, LinkedIn, X, Discord, Telegram",
                  "Launch RTV Discord server with 5 core channels + $RTV airdrop for first 100 members",
                  "Start daily content cadence — TikTok 3x/day, X 5x/day, LinkedIn 2x/day",
                  "Submit $RTV to CoinGecko + CoinMarketCap for listing",
                  "Launch email capture at rotationtvai.com (lead magnet: free RTV AI University intro)",
                  "Apply for Solana Foundation ecosystem grant",
                  "Identify + outreach to 20 Tier 3 micro-influencers (TikTok AI/crypto)",
                  "Submit press release to CoinDesk + Black Enterprise",
                ]
              },
              {
                phase: "Days 31-60",
                label: "📈 AMPLIFICATION",
                color: "from-blue-600 to-cyan-600",
                tasks: [
                  "Launch paid ad campaigns — Meta (30%) + TikTok (25%) + Google (20%)",
                  "Sign 5 KOL partnership deals — pay in $RTV tokens",
                  "List $RTV on Jupiter DEX + Raydium liquidity pool",
                  "Open RTV AI University first cohort enrollment",
                  "Send first 'Rotation Report' newsletter to email list",
                  "Onboard first RotationCall beta users (enterprise VoIP)",
                  "Hit 1,000 Discord members milestone — celebrate with $RTV airdrop",
                  "Forbes + TechCrunch pitch — CEO profile story",
                ]
              },
              {
                phase: "Days 61-90",
                label: "👑 DOMINATION",
                color: "from-purple-600 to-violet-600",
                tasks: [
                  "MEXC or Gate.io centralized exchange listing for $RTV",
                  "Forbes / TechCrunch feature story published",
                  "10,000 email subscribers milestone",
                  "First 100 RotationPay merchants live + processing transactions",
                  "$5M+ in ecosystem TVL (Total Value Locked)",
                  "First RTV AI University NFT diplomas minted on Solana",
                  "Global expansion push — LATAM + Africa + Southeast Asia",
                  "Announce Series A or strategic funding round",
                ]
              }
            ].map((phase, i) => (
              <div key={i} className="bg-[#1a1a35] rounded-xl border border-white/10 overflow-hidden">
                <div className={`bg-gradient-to-r ${phase.color} p-4`}>
                  <div className="font-black text-white text-lg">{phase.phase} — {phase.label}</div>
                </div>
                <div className="p-4 space-y-2">
                  {phase.tasks.map((task, j) => (
                    <div key={j} className="flex items-start gap-3 bg-black/30 rounded-lg p-3">
                      <span className="text-white/30 font-bold text-sm mt-0.5 shrink-0">□</span>
                      <span className="text-white/80 text-sm">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-10 p-6 text-center">
        <p className="text-white/30 text-xs">RotationTV Network AI Command Center • Quantum Precision Master Mode • Built by Base44</p>
        <p className="text-orange-500/60 text-xs mt-1 font-semibold">Presidential Authority: Darrel — Owner & CEO</p>
      </div>
    </div>
  );
}


export default function MarketingCommandCenter() {
  return <OwnerGate><MarketingCommandCenterInner /></OwnerGate>;
}
