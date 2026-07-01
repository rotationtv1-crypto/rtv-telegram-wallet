import OwnerGate from "./OwnerGate";
import { useState, useEffect } from "react";
import { RotationPayTransaction, NFTAsset, RTVToken, ChainstackNode, HeyGenVideo, VoIPNumber, WalletIntegration } from "@/api/entities";

// ─── STRIPE PRODUCTS (live price IDs) ───────────────────────────────────────
const PRODUCTS = [
  { name: "RTV AI University", price: "$297/mo", priceId: "price_1TPvzr6uXd0gkLrQxVPFcEEe", icon: "🎓", color: "purple" },
  { name: "RotationPay Merchant", price: "$99/mo", priceId: "price_1TPvzu6uXd0gkLrQmP1gGIRK", icon: "💳", color: "green" },
  { name: "RotationCall Enterprise", price: "$497/mo", priceId: "price_1TPvzw6uXd0gkLrQtwYJF8qn", icon: "📞", color: "blue" },
  { name: "$RTV Token Pack (1,000)", price: "$49 once", priceId: "price_1TPvzz6uXd0gkLrQwC6zA7ma", icon: "🪙", color: "yellow" },
];

// ─── NINE COMPANIES ──────────────────────────────────────────────────────────
const COMPANIES = [
  { name: "RotationTV Network", icon: "📡", status: "active", url: "https://rotationtvai.com" },
  { name: "RotationPay", icon: "💸", status: "active", url: "https://rotationtvai.com" },
  { name: "RotationCall", icon: "☎️", status: "active", url: "https://rotationcall.net" },
  { name: "RTV AI University", icon: "🎓", status: "active", url: "https://rotationtvai.com" },
  { name: "Bigo Agency", icon: "🎨", status: "active", url: "https://rotationtvai.com" },
  { name: "EmergentLabs", icon: "🔬", status: "active", url: "https://rotationtvai.com" },
  { name: "White Logistics", icon: "🚚", status: "active", url: "https://rotationtvai.com" },
  { name: "Pretrial Services of America", icon: "⚖️", status: "active", url: "https://rotationtvai.com" },
];

// ─── COLOR MAP ───────────────────────────────────────────────────────────────
const COLOR = {
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", btn: "bg-purple-600 hover:bg-purple-500" },
  green:  { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400",  btn: "bg-green-600 hover:bg-green-500" },
  blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   text: "text-blue-400",   btn: "bg-blue-600 hover:bg-blue-500" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", btn: "bg-yellow-600 hover:bg-yellow-500" },
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "blue" }) {
  const c = COLOR[color] || COLOR.blue;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs uppercase tracking-wider">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl font-black ${c.text}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── PULSE DOT ───────────────────────────────────────────────────────────────
function Pulse({ color = "green" }) {
  const map = { green: "bg-green-400", yellow: "bg-yellow-400", red: "bg-red-400", gray: "bg-gray-500" };
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${map[color]} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${map[color]}`} />
    </span>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
function OwnerPanelInner() {
  const [tab, setTab] = useState("dashboard");
  const [txs, setTxs] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [voip, setVoip] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [t, n, tk, nd, v, vo, w] = await Promise.all([
        RotationPayTransaction.list(),
        NFTAsset.list(),
        RTVToken.list(),
        ChainstackNode.list(),
        HeyGenVideo.list(),
        VoIPNumber.list(),
        WalletIntegration.list(),
      ]);
      setTxs(t); setNfts(n); setTokens(tk); setNodes(nd);
      setVideos(v); setVoip(vo); setWallets(w);
      setLoading(false);
    })();
  }, []);

  const totalRevenue = txs.filter(t => t.status === "confirmed").reduce((s, t) => s + (t.amount || 0), 0);
  const confirmedTxs = txs.filter(t => t.status === "confirmed").length;
  const mintedNFTs = nfts.filter(n => n.status === "minted").length;
  const activeNodes = nodes.filter(n => n.status === "active").length;
  const completedVideos = videos.filter(v => v.status === "completed").length;
  const activeNumbers = voip.filter(v => v.status === "active").length;
  const primaryNode = nodes.find(n => n.is_primary) || nodes[0];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "⚡" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "web3", label: "Web3 & Tokens", icon: "⛓️" },
    { id: "companies", label: "Companies", icon: "🏢" },
    { id: "products", label: "Products", icon: "🛒" },
  ];

  return (
    <div className="min-h-screen bg-[#080810] text-white font-sans">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-[#0f0f1f] via-[#1a0a2e] to-[#0a1a2f] border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-xl font-black">R</div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">RotationTV Network</h1>
              <p className="text-xs text-gray-400">Owner's Panel · Presidential Authority</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Pulse color="green" />
              <span className="text-green-400 text-xs font-medium">ECOSYSTEM LIVE</span>
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-mono">{time.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
              <p className="text-gray-500 text-xs">EST</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── NAV ── */}
      <div className="bg-[#0d0d1f] border-b border-white/8 px-6">
        <div className="max-w-6xl mx-auto flex gap-1 py-2 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-gradient-to-r from-orange-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading ecosystem data...</p>
          </div>
        ) : (
          <>
            {/* ─── DASHBOARD ─── */}
            {tab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon="💰" label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub={`${confirmedTxs} confirmed txs`} color="green" />
                  <StatCard icon="🎓" label="NFTs Minted" value={mintedNFTs} sub="Diplomas & passes" color="purple" />
                  <StatCard icon="📞" label="Active Lines" value={activeNumbers} sub="VoIP numbers" color="blue" />
                  <StatCard icon="🎬" label="Videos Live" value={`${completedVideos}/9`} sub="HeyGen renders" color="yellow" />
                </div>

                {/* Infrastructure status */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#0d0d1f] border border-white/8 rounded-xl p-5">
                    <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                      <span>🌐</span> Infrastructure Status
                    </h2>
                    <div className="space-y-3">
                      {[
                        { label: "Solana Mainnet", detail: primaryNode?.node_name || "Chainstack", ok: activeNodes > 0 },
                        { label: "RotationTV AI", detail: "rotationtvai.com", ok: true },
                        { label: "RotationCall", detail: "rotationcall.net", ok: true },
                        { label: "HeyGen Pipeline", detail: `${completedVideos} videos complete`, ok: true },
                        { label: "Stripe Payments", detail: "4 products live", ok: true },
                        { label: "Web3 Wallets", detail: `${wallets.length} connected`, ok: wallets.length > 0 },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-2">
                            <Pulse color={row.ok ? "green" : "red"} />
                            <span className="text-gray-300 text-sm">{row.label}</span>
                          </div>
                          <span className="text-gray-500 text-xs">{row.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0d0d1f] border border-white/8 rounded-xl p-5">
                    <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                      <span>🚀</span> 90-Day Mission Progress
                    </h2>
                    <div className="space-y-3">
                      {[
                        { label: "HeyGen Videos Posted", done: completedVideos >= 9, sub: `${completedVideos}/9 rendered` },
                        { label: "Stripe Payments Live", done: true, sub: "4 products active" },
                        { label: "Discord Server Launch", done: false, sub: "Pending setup" },
                        { label: "$RTV on CoinGecko", done: false, sub: "Pending listing" },
                        { label: "Email Capture Live", done: false, sub: "Needs lead magnet" },
                        { label: "Jupiter DEX Listing", done: false, sub: "Phase 2 — Month 2" },
                        { label: "Forbes/TechCrunch PR", done: false, sub: "Phase 3 — Month 3" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.done ? "bg-green-500 text-white" : "bg-white/8 text-gray-500 border border-white/10"}`}>
                            {item.done ? "✓" : "○"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${item.done ? "text-white" : "text-gray-400"}`}>{item.label}</p>
                            <p className="text-xs text-gray-600">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent transactions */}
                <div className="bg-[#0d0d1f] border border-white/8 rounded-xl p-5">
                  <h2 className="text-white font-bold mb-4 flex items-center gap-2"><span>💳</span> Recent Transactions</h2>
                  {txs.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No transactions yet — payments will appear here instantly</p>
                  ) : (
                    <div className="space-y-2">
                      {txs.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{tx.payment_rail === "stripe" ? "💳" : tx.payment_rail === "solana" ? "⛓️" : "💸"}</span>
                            <div>
                              <p className="text-white text-sm font-medium capitalize">{tx.tx_type || "payment"}</p>
                              <p className="text-gray-500 text-xs">{tx.payment_rail} · {new Date(tx.timestamp || tx.created_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">${(tx.amount || 0).toLocaleString()} {tx.currency}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── PAYMENTS ─── */}
            {tab === "payments" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon="💰" label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="All confirmed" color="green" />
                  <StatCard icon="✅" label="Confirmed" value={confirmedTxs} sub="Transactions" color="blue" />
                  <StatCard icon="⏳" label="Pending" value={txs.filter(t => t.status === "pending").length} sub="Awaiting confirm" color="yellow" />
                  <StatCard icon="⛓️" label="On-Chain" value={txs.filter(t => t.blockchain_confirmed).length} sub="Blockchain confirmed" color="purple" />
                </div>
                <div className="bg-[#0d0d1f] border border-white/8 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/8 flex items-center justify-between">
                    <h2 className="text-white font-bold flex items-center gap-2"><span>📊</span> All Transactions</h2>
                    <span className="text-gray-500 text-sm">{txs.length} total</span>
                  </div>
                  {txs.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-12">No transactions yet</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {txs.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{tx.payment_rail === "stripe" ? "💳" : tx.payment_rail === "solana" ? "⛓️" : "💸"}</span>
                            <div>
                              <p className="text-white text-sm font-medium capitalize">{tx.tx_type || "payment"} · {tx.payment_rail}</p>
                              <p className="text-gray-500 text-xs font-mono truncate max-w-[200px]">{tx.signature || tx.id}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-bold">${(tx.amount || 0).toLocaleString()} <span className="text-gray-400 text-xs">{tx.currency}</span></p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "confirmed" ? "bg-green-500/20 text-green-400" : tx.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── WEB3 & TOKENS ─── */}
            {tab === "web3" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon="⛓️" label="Active Nodes" value={activeNodes} sub="Chainstack" color="blue" />
                  <StatCard icon="👛" label="Wallets" value={wallets.length} sub="Connected" color="green" />
                  <StatCard icon="🪙" label="RTV Tokens" value={tokens.length} sub="Accounts tracked" color="yellow" />
                  <StatCard icon="🎓" label="NFTs Minted" value={mintedNFTs} sub="On Solana" color="purple" />
                </div>

                {/* Nodes */}
                <div className="bg-[#0d0d1f] border border-white/8 rounded-xl p-5">
                  <h2 className="text-white font-bold mb-4 flex items-center gap-2"><span>⛓️</span> Chainstack Nodes</h2>
                  {nodes.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No nodes registered</p>
                  ) : (
                    <div className="space-y-3">
                      {nodes.map(node => (
                        <div key={node.id} className="flex items-center justify-between bg-white/3 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Pulse color={node.status === "active" ? "green" : "red"} />
                            <div>
                              <p className="text-white font-medium text-sm">{node.node_name}</p>
                              <p className="text-gray-500 text-xs font-mono truncate max-w-[280px]">{node.rpc_endpoint}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${node.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{node.status}</span>
                            <p className="text-gray-500 text-xs mt-1">{node.network}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* NFTs */}
                <div className="bg-[#0d0d1f] border border-white/8 rounded-xl p-5">
                  <h2 className="text-white font-bold mb-4 flex items-center gap-2"><span>🎓</span> NFT Assets</h2>
                  {nfts.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No NFTs minted yet — diplomas and passes will appear here</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {nfts.map(nft => (
                        <div key={nft.id} className="bg-white/3 border border-white/8 rounded-xl p-3">
                          {nft.image_url ? (
                            <img src={nft.image_url} alt={nft.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                          ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg mb-2 flex items-center justify-center text-4xl">🎓</div>
                          )}
                          <p className="text-white text-sm font-medium truncate">{nft.name}</p>
                          <p className="text-gray-500 text-xs truncate">{nft.asset_type}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${nft.status === "minted" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{nft.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── COMPANIES ─── */}
            {tab === "companies" && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">All 8 companies in the RotationTV Network ecosystem</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {COMPANIES.map(co => (
                    <div key={co.name} className="bg-[#0d0d1f] border border-white/8 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-2xl">{co.icon}</div>
                        <div>
                          <p className="text-white font-semibold text-sm">{co.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Pulse color="green" />
                            <span className="text-green-400 text-xs">Active</span>
                          </div>
                        </div>
                      </div>
                      <a href={co.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                        Visit →
                      </a>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-xl p-5 text-center">
                  <p className="text-orange-300 font-black text-lg">"While others build apps, we built an ecosystem."</p>
                  <p className="text-gray-400 text-sm mt-1">— Learn it. Live it. Love it. We keep business rotating globally.</p>
                </div>
              </div>
            )}

            {/* ─── PRODUCTS ─── */}
            {tab === "products" && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Stripe payment products — currently in TEST mode. Use card <span className="font-mono text-white bg-white/10 px-1 rounded">4242 4242 4242 4242</span> to test.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {PRODUCTS.map(p => {
                    const c = COLOR[p.color];
                    return (
                      <div key={p.name} className={`${c.bg} border ${c.border} rounded-xl p-5`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{p.icon}</span>
                          <div>
                            <p className="text-white font-bold">{p.name}</p>
                            <p className={`text-lg font-black ${c.text}`}>{p.price}</p>
                          </div>
                        </div>
                        <p className="text-gray-500 text-xs font-mono mb-3">Price ID: {p.priceId}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/20">✅ Live</span>
                          <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/20">TEST MODE</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-[#0d0d1f] border border-white/8 rounded-xl p-5">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2"><span>⚡</span> Go Live Checklist</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Replace STRIPE_SECRET_KEY with sk_live_... key", done: false },
                      { label: "Add SLACK_WEBHOOK_URL for payment alerts", done: false },
                      { label: "Add DISCORD_WEBHOOK_URL for payment alerts", done: false },
                      { label: "Register Stripe webhook for live events", done: false },
                      { label: "Test all 4 checkout flows end-to-end", done: false },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${item.done ? "bg-green-500 border-green-500" : "border-white/20"}`}>
                          {item.done ? "✓" : ""}
                        </div>
                        <span className={`text-sm ${item.done ? "text-gray-400 line-through" : "text-gray-300"}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-white/8 px-6 py-3 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-gray-600 text-xs">RotationTV Network · Owner's Panel · Presidential Authority: Darrel</p>
          <p className="text-gray-600 text-xs">Powered by Base44 AI Command Center</p>
        </div>
      </div>
    </div>
  );
}


export default function OwnerPanel() {
  return <OwnerGate><OwnerPanelInner /></OwnerGate>;
}
