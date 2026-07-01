import OwnerGate from "./OwnerGate";
import { useState, useEffect } from "react";
import { VoIPNumber, CallForwarding } from "@/api/entities";

const STATUS_COLORS = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  porting: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  released: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CONDITION_LABELS = {
  always: "Always",
  busy: "On Busy",
  no_answer: "No Answer",
  unavailable: "Unavailable",
  time_based: "Time Based",
  caller_id: "Caller ID",
};

function Badge({ label, color }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {label}
    </span>
  );
}

function CapabilityTag({ cap }) {
  const colors = {
    voice: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    sms: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    mms: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    fax: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${colors[cap] || "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>
      {cap.toUpperCase()}
    </span>
  );
}

function ReleaseModal({ number, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-lg">⚠️</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Release Number</h3>
            <p className="text-gray-400 text-sm">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-gray-300 mb-2">
          You are about to release <span className="text-white font-mono font-semibold">{number.phone_number}</span>
          {number.friendly_name && <span className="text-gray-400"> ({number.friendly_name})</span>}.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          This will permanently remove the number from your account and cancel all associated forwarding rules. Monthly billing will stop at end of cycle.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
          >
            Release Number
          </button>
        </div>
      </div>
    </div>
  );
}

function ForwardingRuleRow({ rule, onToggle, onEdit }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/20 border border-white/5">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.enabled ? "bg-green-400" : "bg-gray-500"}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium truncate">{rule.rule_name || "Forwarding Rule"}</span>
            <Badge label={CONDITION_LABELS[rule.condition] || rule.condition} color="bg-blue-500/20 text-blue-300 border-blue-500/30" />
          </div>
          <p className="text-gray-400 text-xs mt-0.5 truncate">→ {rule.destination}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <button
          onClick={() => onToggle(rule)}
          className={`text-xs px-2 py-1 rounded transition-colors ${rule.enabled ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400" : "bg-gray-600/30 text-gray-400 hover:bg-green-500/20 hover:text-green-400"}`}
        >
          {rule.enabled ? "ON" : "OFF"}
        </button>
        <button onClick={() => onEdit(rule)} className="text-xs px-2 py-1 bg-white/5 text-gray-300 rounded hover:bg-white/10 transition-colors">
          Edit
        </button>
      </div>
    </div>
  );
}

function ForwardingEditModal({ rule, numberId, onSave, onClose }) {
  const [form, setForm] = useState(
    rule || {
      voip_number_id: numberId,
      rule_name: "",
      condition: "always",
      destination: "",
      ring_timeout_sec: 20,
      whisper_message: "",
      enabled: true,
      priority: 1,
      rtv_module: "RotationCall",
    }
  );

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] border border-blue-500/30 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">{rule ? "Edit Forwarding Rule" : "Add Forwarding Rule"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Rule Name</label>
            <input
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
              placeholder="e.g. After Hours Forward"
              value={form.rule_name}
              onChange={(e) => handleChange("rule_name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Condition</label>
              <select
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                value={form.condition}
                onChange={(e) => handleChange("condition", e.target.value)}
              >
                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Ring Timeout (sec)</label>
              <input
                type="number"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
                value={form.ring_timeout_sec}
                onChange={(e) => handleChange("ring_timeout_sec", Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Destination Number / SIP URI</label>
            <input
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
              placeholder="+1 (555) 000-0000 or sip:user@domain.com"
              value={form.destination}
              onChange={(e) => handleChange("destination", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Whisper Message <span className="text-gray-600">(optional)</span></label>
            <input
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
              placeholder="e.g. RotationTV business call"
              value={form.whisper_message}
              onChange={(e) => handleChange("whisper_message", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleChange("enabled", !form.enabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.enabled ? "bg-green-500" : "bg-gray-600"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className="text-gray-300 text-sm">{form.enabled ? "Rule Enabled" : "Rule Disabled"}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberCard({ number, forwardingRules, onRelease, onEditForwarding, onAddForwarding, onToggleForwarding }) {
  const [expanded, setExpanded] = useState(false);
  const rules = forwardingRules.filter((r) => r.voip_number_id === number.id);

  return (
    <div className="bg-[#1a1f2e] border border-white/8 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📞</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-mono font-semibold">{number.phone_number}</span>
                <Badge label={number.status} color={STATUS_COLORS[number.status] || STATUS_COLORS.inactive} />
              </div>
              {number.friendly_name && <p className="text-gray-400 text-sm mt-0.5">{number.friendly_name}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-gray-500 text-xs capitalize">{number.provider}</span>
                {number.rtv_module && <span className="text-gray-600 text-xs">· {number.rtv_module}</span>}
                {number.region && <span className="text-gray-600 text-xs">· {number.region}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(number.capabilities || []).map((cap) => <CapabilityTag key={cap} cap={cap} />)}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>📋</span>
            <span>{rules.length} Forwarding Rule{rules.length !== 1 ? "s" : ""}</span>
            <span className="ml-0.5">{expanded ? "▲" : "▼"}</span>
          </button>
          <button
            onClick={() => onAddForwarding(number)}
            className="ml-auto text-xs px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors"
          >
            + Add Rule
          </button>
          <button
            onClick={() => onRelease(number)}
            className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
          >
            Release
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
          {rules.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-2">No forwarding rules. Add one above.</p>
          ) : (
            rules.map((rule) => (
              <ForwardingRuleRow
                key={rule.id}
                rule={rule}
                onToggle={onToggleForwarding}
                onEdit={onEditForwarding}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function VoIPManagerInner() {
  const [numbers, setNumbers] = useState([]);
  const [forwardingRules, setForwardingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [editRule, setEditRule] = useState(null);
  const [addRuleFor, setAddRuleFor] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [nums, rules] = await Promise.all([
        VoIPNumber.list(),
        CallForwarding.list(),
      ]);
      setNumbers(nums);
      setForwardingRules(rules);
    } catch (e) {
      showToast("Failed to load data", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRelease = async (number) => {
    try {
      await VoIPNumber.update(number.id, { status: "released" });
      showToast(`${number.phone_number} released`);
      setReleaseTarget(null);
      load();
    } catch {
      showToast("Release failed", "error");
    }
  };

  const handleToggleForwarding = async (rule) => {
    try {
      await CallForwarding.update(rule.id, { enabled: !rule.enabled });
      showToast(`Rule ${rule.enabled ? "disabled" : "enabled"}`);
      load();
    } catch {
      showToast("Toggle failed", "error");
    }
  };

  const handleSaveRule = async (form) => {
    try {
      if (form.id) {
        await CallForwarding.update(form.id, form);
        showToast("Rule updated");
      } else {
        await CallForwarding.create(form);
        showToast("Rule created");
      }
      setEditRule(null);
      setAddRuleFor(null);
      load();
    } catch {
      showToast("Save failed", "error");
    }
  };

  const activeCount = numbers.filter((n) => n.status === "active").length;
  const fwdCount = forwardingRules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {releaseTarget && (
        <ReleaseModal
          number={releaseTarget}
          onConfirm={() => handleRelease(releaseTarget)}
          onCancel={() => setReleaseTarget(null)}
        />
      )}

      {(editRule || addRuleFor) && (
        <ForwardingEditModal
          rule={editRule}
          numberId={addRuleFor?.id || editRule?.voip_number_id}
          onSave={handleSaveRule}
          onClose={() => { setEditRule(null); setAddRuleFor(null); }}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              VoIP Manager
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">RotationTV Network · Phone Number Control</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-semibold text-lg">{activeCount}</p>
              <p className="text-gray-400 text-xs">Active</p>
            </div>
            <div className="text-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 font-semibold text-lg">{fwdCount}</p>
              <p className="text-gray-400 text-xs">Forwarding</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white font-semibold text-lg">{numbers.length}</p>
              <p className="text-gray-400 text-xs">Total</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : numbers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📞</p>
            <p className="text-lg font-medium text-gray-400">No numbers provisioned yet</p>
            <p className="text-sm mt-1">Numbers added via Twilio, Vonage, or Telnyx will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {numbers.map((number) => (
              <NumberCard
                key={number.id}
                number={number}
                forwardingRules={forwardingRules}
                onRelease={setReleaseTarget}
                onEditForwarding={setEditRule}
                onAddForwarding={setAddRuleFor}
                onToggleForwarding={handleToggleForwarding}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function VoIPManager() {
  return <OwnerGate><VoIPManagerInner /></OwnerGate>;
}
