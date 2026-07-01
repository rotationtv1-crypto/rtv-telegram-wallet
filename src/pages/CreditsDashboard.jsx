import OwnerGate from "./OwnerGate";
import { useState, useEffect } from "react";
import { AcademyCredit, NFTAsset, RTVMintOperation } from "@/api/entities";

const CREDIT_TYPE_COLORS = {
  earned: "bg-green-500/20 text-green-400 border-green-500/30",
  purchased: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  granted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  bonus: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  referral: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  refunded: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const MOCK_COURSES = [
  { id: "rtv-101", name: "RotationTV Creator Foundations", progress: 100, credits: 50, status: "completed", nft_minted: true },
  { id: "rtv-201", name: "Web3 Commerce & $RTV Tokenomics", progress: 72, credits: 75, status: "in_progress", nft_minted: false },
  { id: "rtv-301", name: "RotationCall Enterprise Setup", progress: 45, credits: 60, status: "in_progress", nft_minted: false },
  { id: "rtv-401", name: "AI Creator Platform Mastery", progress: 18, credits: 100, status: "in_progress", nft_minted: false },
  { id: "rtv-501", name: "Blockchain Payments Integration", progress: 0, credits: 80, status: "not_started", nft_minted: false },
];

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className={`bg-[#1a1f2e] border rounded-xl p-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function CreditLedgerRow({ entry }) {
  const isDebit = entry.amount < 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDebit ? "bg-red-500/20" : "bg-green-500/20"}`}>
          <span className="text-sm">{isDebit ? "↓" : "↑"}</span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{entry.description || (entry.course_name ? `Completed: ${entry.course_name}` : "Credit Transaction")}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-1.5 py-0.5 rounded border ${CREDIT_TYPE_COLORS[entry.credit_type] || CREDIT_TYPE_COLORS.earned}`}>
              {entry.credit_type}
            </span>
            {entry.nft_diploma_minted && <span className="text-xs text-yellow-400">🎓 NFT Issued</span>}
            <span className="text-gray-500 text-xs">{entry.created_date ? new Date(entry.created_date).toLocaleDateString() : ""}</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className={`font-semibold ${isDebit ? "text-red-400" : "text-green-400"}`}>
          {isDebit ? "" : "+"}{entry.amount.toLocaleString()}
        </p>
        {entry.balance_after != null && (
          <p className="text-gray-500 text-xs">{entry.balance_after.toLocaleString()} bal.</p>
        )}
      </div>
    </div>
  );
}

function CourseProgressBar({ course, onGrantNFT, onMintDiploma }) {
  const statusColors = {
    completed: "from-green-500 to-emerald-400",
    in_progress: "from-blue-500 to-cyan-400",
    not_started: "from-gray-600 to-gray-500",
  };

  return (
    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{course.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">{course.credits} credits on completion</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {course.status === "completed" && !course.nft_minted && (
            <button
              onClick={() => onMintDiploma(course)}
              className="text-xs px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg transition-colors"
            >
              🎓 Mint Diploma
            </button>
          )}
          {course.status === "completed" && course.nft_minted && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">🎓 Diploma NFT</span>
          )}
          {course.status !== "completed" && (
            <button
              onClick={() => onGrantNFT(course)}
              className="text-xs px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg transition-colors"
            >
              + Grant Credits
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${statusColors[course.status]} transition-all duration-500`}
            style={{ width: `${course.progress}%` }}
          />
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0 w-10 text-right">{course.progress}%</span>
      </div>
    </div>
  );
}

function GrantModal({ onSave, onClose }) {
  const [form, setForm] = useState({ credit_type: "granted", amount: 0, description: "", course_name: "", status: "active" });
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] border border-purple-500/30 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Grant / Deduct Credits</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Type</label>
            <select
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={form.credit_type}
              onChange={(e) => setForm((f) => ({ ...f, credit_type: e.target.value }))}
            >
              {["earned", "purchased", "granted", "bonus", "referral", "refunded"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Amount (negative to deduct)</label>
            <input
              type="number"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Description</label>
            <input
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Reason for grant..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Course Name (optional)</label>
            <input
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="e.g. Web3 Foundations"
              value={form.course_name}
              onChange={(e) => setForm((f) => ({ ...f, course_name: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
          <button
            onClick={() => onSave({ ...form, user_id: "admin" })}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CreditsDashboardInner() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGrant, setShowGrant] = useState(false);
  const [toast, setToast] = useState(null);

  const showToastMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const entries = await AcademyCredit.list();
      setLedger(entries);
    } catch {
      showToastMsg("Failed to load ledger", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalCredits = ledger.reduce((sum, e) => sum + (e.amount || 0), 0);
  const earnedCredits = ledger.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const spentCredits = ledger.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0);
  const diplomaCount = ledger.filter((e) => e.nft_diploma_minted).length;

  const handleGrant = async (form) => {
    try {
      await AcademyCredit.create(form);
      showToastMsg("Credits updated");
      setShowGrant(false);
      load();
    } catch {
      showToastMsg("Failed to save credits", "error");
    }
  };

  const handleMintDiploma = async (course) => {
    try {
      await AcademyCredit.create({
        user_id: "admin",
        credit_type: "earned",
        amount: course.credits,
        description: `Diploma awarded: ${course.name}`,
        course_id: course.id,
        course_name: course.name,
        nft_diploma_minted: true,
        status: "active",
      });
      showToastMsg(`🎓 Diploma NFT queued for ${course.name}`);
      load();
    } catch {
      showToastMsg("Mint failed", "error");
    }
  };

  const handleGrantCourseCredits = async (course) => {
    try {
      await AcademyCredit.create({
        user_id: "admin",
        credit_type: "granted",
        amount: Math.round(course.credits * course.progress / 100),
        description: `Progress credits: ${course.name} (${course.progress}%)`,
        course_id: course.id,
        course_name: course.name,
        status: "active",
      });
      showToastMsg("Credits granted");
      load();
    } catch {
      showToastMsg("Grant failed", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white`}>
          {toast.msg}
        </div>
      )}

      {showGrant && <GrantModal onSave={handleGrant} onClose={() => setShowGrant(false)} />}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Credits & Academy
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">RotationTV Network · Learning & Rewards</p>
          </div>
          <button
            onClick={() => setShowGrant(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition-colors"
          >
            + Grant Credits
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Balance" value={totalCredits.toLocaleString()} sub="RTV Academy Credits" color="border-purple-500/20" icon="🏆" />
          <StatCard label="Earned" value={`+${earnedCredits.toLocaleString()}`} sub="All time" color="border-green-500/20" icon="✅" />
          <StatCard label="Spent" value={spentCredits.toLocaleString()} sub="Used on courses" color="border-red-500/20" icon="📚" />
          <StatCard label="Diplomas" value={diplomaCount} sub="NFTs minted" color="border-yellow-500/20" icon="🎓" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Course Progress */}
          <div className="bg-[#1a1f2e] border border-white/8 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>📚</span> Course Progress
            </h2>
            <div className="space-y-3">
              {MOCK_COURSES.map((course) => (
                <CourseProgressBar
                  key={course.id}
                  course={course}
                  onGrantNFT={handleGrantCourseCredits}
                  onMintDiploma={handleMintDiploma}
                />
              ))}
            </div>
          </div>

          {/* Credit Ledger */}
          <div className="bg-[#1a1f2e] border border-white/8 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>📋</span> Credit Ledger
              <span className="ml-auto text-gray-500 text-xs font-normal">{ledger.length} entries</span>
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : ledger.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-3xl mb-2">🏅</p>
                <p className="text-sm">No credit history yet</p>
                <p className="text-xs mt-1">Grant credits or complete a course to start</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {ledger.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((entry) => (
                  <CreditLedgerRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function CreditsDashboard() {
  return <OwnerGate><CreditsDashboardInner /></OwnerGate>;
}
