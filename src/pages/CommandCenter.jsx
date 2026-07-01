import OwnerGate from "./OwnerGate";
import { useState, useEffect } from "react";
import { VoIPNumber, CallForwarding, AcademyCredit, RotationPayTransaction, NFTAsset, RTVToken, ChainstackNode } from "@/api/entities";

const MODULES = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "voip", label: "VoIP Manager", icon: "📞" },
  { id: "credits", label: "Credits & Academy", icon: "🎓" },
  { id: "forwarding", label: "Call Forwarding", icon: "📋" },
];

function MetricCard({ label, value, sub, icon, trend, color = "border-white/10" }) {
  return (
    <div className={`bg-[#1a1f2e] border ${color} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      {trend && (
        <p className={`text-xs mt-1 font-medium ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week
        </p>
      )}
    </div>
  );
}

function EcosystemStatusRow({ label, status, detail, icon }) {
  const isOk = status === "ok" || status === "active" || status === "online";
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-gray-500 text-xs">{detail}</span>}
        <span className={`w-2 h-2 rounded-full ${isOk ? "bg-green-400" : "bg-red-400"}`} />
      </div>
    </div>
  );
}

// ---- OVERVIEW ----
function OverviewTab({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Active Numbers" value={stats.activeNumbers} sub="VoIP lines" icon="📞" color="border-blue-500/20" />
        <MetricCard label="Credit Balance" value={stats.creditBalance.toLocaleString()} sub="Academy credits" icon="🏆" color="border-purple-500/20" />
        <MetricCard label="NFTs Minted" value={stats.nftCount} sub="Diplomas & passes" icon="🎓" color="border-yellow-500/20" />
        <MetricCard label="Transactions" value={stats.txCount} sub="RotationPay" icon="💳" color="border-green-500/20" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#1a1f2e] border border-white/8 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><span>🌐</span> Ecosystem Status</h3>
          <div className="divide-y divide-white/5">
            <EcosystemStatusRow label="Solana Mainnet Node" status={stats.solanaStatus} detail="Chainstack" icon="⛓️" />
            <EcosystemStatusRow label="RotationTV AI" status="ok" detail="rotationtvai.com" icon="🤖" />
            <EcosystemStatusRow label="RotationCall" status="ok" detail="Enterprise Voice" icon="☎️" />
            <EcosystemStatusRow label="RotationPay" status="ok" detail="PayPal + Stripe + Solana + 4 more rails" icon="💸" />
            <EcosystemStatusRow label="HeyGen Video" status="ok" detail="6 companies active" icon="🎬" />
            <EcosystemStatusRow label="Slack Bot" status="ok" detail="Connected" icon="💬" />
          </div>
        </div>

        <div className="bg-[#1a1f2e] border border-white/8 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><span>🚀</span> Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Provision New Number", icon: "📞", color: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400" },
              { label: "Grant Academy Credits", icon: "🏆", color: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-400" },
              { label: "Mint NFT Diploma", icon: "🎓", color: "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-400" },
              { label: "View Transactions", icon: "💳", color: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-400" },
              { label: "Run Health Check", icon: "💚", color: "bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20 text-teal-400" },
            ].map((action) => (
              <button key={action.label} className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${action.color}`}>
                <span>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- FORWARDING VIEW ----
const CONDITION_LABELS = {
  always: "Always",
  busy: "On Busy",
  no_answer: "No Answer",
  unavailable: "Unavailable",
  time_based: "Time Based",
  caller_id: "Caller ID",
};

function ForwardingFullView() {
  const [rules, setRules] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editRule, setEditRule] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    const [r, n] = await Promise.all([CallForwarding.list(), VoIPNumber.list()]);
    setRules(r);
    setNumbers(n);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getNumber = (rule) => numbers.find((n) => n.id === rule.voip_number_id);

  const handleToggle = async (rule) => {
    await CallForwarding.update(rule.id, { enabled: !rule.enabled });
    showToast(`Rule ${rule.enabled ? "disabled" : "enabled"}`);
    load();
  };

  const handleSave = async (form) => {
    if (form.id) await CallForwarding.update(form.id, form);
    else await CallForwarding.create(form);
    showToast("Rule saved");
    setEditRule(null);
    load();
  };

  const handleDelete = async (rule) => {
    await CallForwarding.delete(rule.id);
    showToast("Rule deleted");
    load();
  };

  const filtered = filter === "all" ? rules : rules.filter((r) => (filter === "enabled" ? r.enabled : !r.enabled));

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex bg-white/5 rounded-lg p-1 gap-1">
          {["all", "enabled", "disabled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm capitalize transition-colors ${filter === f ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-sm ml-auto">{filtered.length} rules</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><p className="text-3xl mb-2">📋</p><p>No forwarding rules yet</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rule) => {
            const num = getNumber(rule);
            return (
              <div key={rule.id} className="bg-[#1a1f2e] border border-white/8 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${rule.enabled ? "bg-green-400" : "bg-gray-500"}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium">{rule.rule_name || "Forwarding Rule"}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {CONDITION_LABELS[rule.condition] || rule.condition}
                        </span>
                      </div>
                      {num && <p className="text-gray-500 text-xs mt-0.5">{num.phone_number} {num.friendly_name ? `· ${num.friendly_name}` : ""}</p>}
                      <p className="text-gray-400 text-sm mt-1">→ <span className="font-mono text-white/80">{rule.destination}</span></p>
                      {rule.ring_timeout_sec && <p className="text-gray-500 text-xs mt-0.5">Ring {rule.ring_timeout_sec}s before forwarding</p>}
                      {rule.whisper_message && <p className="text-gray-500 text-xs italic mt-0.5">Whisper: "{rule.whisper_message}"</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${rule.enabled ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30" : "bg-gray-600/30 text-gray-400 border-gray-600/30 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30"}`}
                    >
                      {rule.enabled ? "ON" : "OFF"}
                    </button>
                    <button onClick={() => setEditRule(rule)} className="text-xs px-2 py-1 bg-white/5 text-gray-300 rounded border border-white/10 hover:bg-white/10 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(rule)} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded border border-red-500/20 hover:bg-red-500/20 transition-colors">Del</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editRule && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1f2e] border border-blue-500/30 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Edit Forwarding Rule</h3>
              <button onClick={() => setEditRule(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <ForwardingEditInline rule={editRule} onSave={handleSave} onClose={() => setEditRule(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ForwardingEditInline({ rule, onSave, onClose }) {
  const [form, setForm] = useState({ ...rule });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-gray-400 text-sm mb-1">Rule Name</label>
        <input className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" value={form.rule_name || ""} onChange={(e) => set("rule_name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Condition</label>
          <select className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" value={form.condition} onChange={(e) => set("condition", e.target.value)}>
            {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Ring Timeout (sec)</label>
          <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" value={form.ring_timeout_sec || ""} onChange={(e) => set("ring_timeout_sec", Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="block text-gray-400 text-sm mb-1">Destination</label>
        <input className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" value={form.destination} onChange={(e) => set("destination", e.target.value)} />
      </div>
      <div>
        <label className="block text-gray-400 text-sm mb-1">Whisper Message</label>
        <input className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" value={form.whisper_message || ""} onChange={(e) => set("whisper_message", e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => set("enabled", !form.enabled)} className={`relative w-10 h-5 rounded-full transition-colors ${form.enabled ? "bg-green-500" : "bg-gray-600"}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.enabled ? "translate-x-5" : ""}`} />
        </button>
        <span className="text-gray-300 text-sm">{form.enabled ? "Enabled" : "Disabled"}</span>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm">Cancel</button>
        <button onClick={() => onSave(form)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm">Save</button>
      </div>
    </div>
  );
}

// ---- MAIN COMMAND CENTER ----
function CommandCenterInner() {
  const [activeModule, setActiveModule] = useState("overview");
  const [stats, setStats] = useState({ activeNumbers: 0, creditBalance: 0, nftCount: 0, txCount: 0, solanaStatus: "ok" });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        const [numbers, credits, nfts, txs, nodes] = await Promise.all([
          VoIPNumber.list(),
          AcademyCredit.list(),
          NFTAsset.list(),
          RotationPayTransaction.list(),
          ChainstackNode.list(),
        ]);
        const creditBalance = credits.reduce((s, e) => s + (e.amount || 0), 0);
        const activeNode = nodes.find((n) => n.status === "active");
        setStats({
          activeNumbers: numbers.filter((n) => n.status === "active").length,
          creditBalance,
          nftCount: nfts.length,
          txCount: txs.length,
          solanaStatus: activeNode ? "active" : "inactive",
        });
      } catch {}
      setLoadingStats(false);
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0d1117]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">R</div>
              <div>
                <h1 className="text-white font-bold text-sm leading-none">RotationTV Network</h1>
                <p className="text-gray-500 text-xs leading-none mt-0.5">AI Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="border-b border-white/8 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 py-1">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModule === mod.id
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{mod.icon}</span>
                <span className="hidden sm:inline">{mod.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {activeModule === "overview" && <OverviewTab stats={stats} />}
        {activeModule === "voip" && (
          <iframe
            src="/VoIPManager"
            className="w-full rounded-xl border border-white/8"
            style={{ height: "calc(100vh - 140px)" }}
            title="VoIP Manager"
          />
        )}
        {activeModule === "credits" && (
          <iframe
            src="/CreditsDashboard"
            className="w-full rounded-xl border border-white/8"
            style={{ height: "calc(100vh - 140px)" }}
            title="Credits & Academy"
          />
        )}
        {activeModule === "forwarding" && <ForwardingFullView />}
      </div>
    </div>
  );
}


export default function CommandCenter() {
  return <OwnerGate><CommandCenterInner /></OwnerGate>;
}
