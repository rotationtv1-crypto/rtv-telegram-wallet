// ============================================
// ROTATIONTV — GO LIVE MODAL
// Full camera + mic permission + live preview
// DO NOT CHANGE theme/colors/specs
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Radio, Camera, Mic, MicOff, VideoOff, FlipHorizontal } from "lucide-react";
import { useStore } from "../store/useStore";
import { useTelegram } from "../hooks/useTelegram";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── Locked theme tokens ──────────────────────────
const T = {
  bg: "#141414",
  surface: "#1A1A2E",
  card: "#16213E",
  primary: "#6C5CE7",
  accent: "#00CEC9",
  live: "#FF4444",
  text: "#FFFFFF",
  textSub: "#B2B2B2",
  success: "#00B894",
  warn: "#FDCB6E",
  error: "#FF6B6B",
};

type PermState = "idle" | "requesting" | "granted" | "denied";

interface GoLiveModalProps {
  onClose: () => void;
  onGoLive?: (data: any) => void;
}

export function GoLiveModal({ onClose, onGoLive }: GoLiveModalProps) {
  const { user } = useStore();
  const tg = useTelegram();

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("talk");
  const [loading, setLoading] = useState(false);
  const [streamInfo, setStreamInfo] = useState<any>(null);

  // Media state
  const [permState, setPermState] = useState<PermState>("idle");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [micLevel, setMicLevel] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Request camera + mic on mount ───────────────
  useEffect(() => {
    requestMedia(facingMode);
    return () => stopMedia();
  }, []);

  // ── Re-request when camera facing flips ─────────
  useEffect(() => {
    if (permState === "granted") requestMedia(facingMode);
  }, [facingMode]);

  // ── Toggle camera track ──────────────────────────
  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
  }, [cameraOn]);

  // ── Toggle mic track ────────────────────────────
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);

  async function requestMedia(facing: "user" | "environment") {
    setPermState("requesting");
    stopMedia();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      // Wire up mic analyser
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, avg * 2.8));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setPermState("granted");
    } catch (err: any) {
      console.error("Media permission error:", err);
      setPermState("denied");
      tg?.showAlert("Camera/mic access denied. Please enable permissions in your device settings.");
    }
  }

  function stopMedia() {
    cancelAnimationFrame(rafRef.current);
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  const handleClose = () => {
    stopMedia();
    onClose();
  };

  // ── Go live ─────────────────────────────────────
  const goLive = async () => {
    if (!title.trim() || !user) return;
    setLoading(true);
    if (!user.is_creator) {
      await fetch(`${API_BASE}/api/become-creator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
    }
    try {
      const r = await fetch(`${API_BASE}/api/stream/create-input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: user.id,
          title,
          creator_name: user.display_name,
        }),
      });
      const d = await r.json();
      if (d.success) {
        await fetch(`${API_BASE}/api/streams/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creator_id: user.id, title, category }),
        });
        setStreamInfo(d);
        tg?.HapticFeedback?.notificationOccurred("success");
        onGoLive?.({ ...d, localStream: streamRef.current });
      } else {
        tg?.showAlert(d.error || "Failed to start stream");
      }
    } catch {
      tg?.showAlert("Stream setup failed. Check Cloudflare secrets.");
    }
    setLoading(false);
  };

  // ── Permission gate ──────────────────────────────
  if (permState === "idle" || permState === "requesting") {
    return (
      <ModalShell onClose={handleClose}>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            Requesting camera & mic...
          </div>
          <div style={{ color: T.textSub, fontSize: 13 }}>
            Allow access when your device prompts
          </div>
        </div>
      </ModalShell>
    );
  }

  if (permState === "denied") {
    return (
      <ModalShell onClose={handleClose}>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
          <div style={{ color: T.error, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            Camera / Mic Access Denied
          </div>
          <div style={{ color: T.textSub, fontSize: 13, marginBottom: 20 }}>
            Go to your device Settings → Browser/Telegram → enable Camera and Microphone
          </div>
          <button
            onClick={() => requestMedia(facingMode)}
            style={{ ...btnStyle, background: T.primary, color: T.text }}
          >
            Try Again
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Main UI (permissions granted) ───────────────
  return (
    <ModalShell onClose={handleClose}>
      {!streamInfo ? (
        <>
          {/* Camera preview */}
          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            borderRadius: 12,
            overflow: "hidden",
            background: "#000",
            marginBottom: 12,
          }}>
            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <VideoOff size={40} color={T.textSub} />
              </div>
            )}

            {/* Camera controls overlay */}
            <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 8 }}>
              {/* Flip camera */}
              <button
                onClick={() => setFacingMode(f => f === "user" ? "environment" : "user")}
                style={camBtnStyle}
                title="Flip camera"
              >
                <FlipHorizontal size={16} color={T.text} />
              </button>
              {/* Toggle camera */}
              <button
                onClick={() => setCameraOn(v => !v)}
                style={{ ...camBtnStyle, background: cameraOn ? "rgba(0,0,0,0.6)" : T.error + "CC" }}
                title={cameraOn ? "Turn off camera" : "Turn on camera"}
              >
                <Camera size={16} color={T.text} />
              </button>
              {/* Toggle mic */}
              <button
                onClick={() => setMicOn(v => !v)}
                style={{ ...camBtnStyle, background: micOn ? "rgba(0,0,0,0.6)" : T.error + "CC" }}
                title={micOn ? "Mute mic" : "Unmute mic"}
              >
                {micOn ? <Mic size={16} color={T.text} /> : <MicOff size={16} color={T.text} />}
              </button>
            </div>

            {/* LIVE badge preview */}
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.live }} />
              <span style={{ color: T.text, fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 4 }}>PREVIEW</span>
            </div>
          </div>

          {/* Mic level bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {micOn ? <Mic size={12} color={T.accent} /> : <MicOff size={12} color={T.error} />}
              <span style={{ color: T.textSub, fontSize: 11 }}>
                {micOn ? (micLevel < 5 ? "Mic active — speak to test" : "Mic working ✓") : "Mic muted"}
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${micLevel}%`,
                borderRadius: 2,
                background: micLevel > 70 ? T.error : micLevel > 40 ? T.warn : T.accent,
                transition: "width 0.06s linear",
              }} />
            </div>
          </div>

          {/* Title input */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Stream title..."
            maxLength={60}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              color: T.text,
              border: "1px solid rgba(108,92,231,0.2)",
              outline: "none",
              fontSize: 14,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />

          {/* Category selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["talk", "music", "gaming", "pk", "lifestyle"].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  background: category === c ? T.primary : "rgba(255,255,255,0.05)",
                  color: category === c ? T.text : T.textSub,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Go Live button */}
          <button
            onClick={goLive}
            disabled={loading || !title.trim()}
            style={{
              ...btnStyle,
              background: T.live,
              color: T.text,
              opacity: loading || !title.trim() ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Radio size={18} />
            {loading ? "Starting..." : "Go Live 🔴"}
          </button>
        </>
      ) : (
        /* Stream started — show RTMP/HLS details */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔴</div>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 18 }}>You are Live!</div>
            <div style={{ color: T.textSub, fontSize: 13, marginTop: 4 }}>
              Camera & mic active — stream is running
            </div>
          </div>

          {[
            { label: "RTMP URL (OBS / Streamlabs)", value: streamInfo.rtmp_url },
            { label: "Stream Key", value: streamInfo.stream_key },
            { label: "HLS Playback", value: streamInfo.playback?.hls },
          ].map(({ label, value }) =>
            value ? (
              <div key={label} style={{ borderRadius: 10, padding: "10px 12px", background: "#0A0A0A" }}>
                <div style={{ color: T.textSub, fontSize: 11, marginBottom: 4 }}>{label}</div>
                <div style={{ color: T.accent, fontSize: 12, fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
                  {value}
                </div>
              </div>
            ) : null
          )}

          <button
            onClick={handleClose}
            style={{ ...btnStyle, background: T.primary, color: T.text }}
          >
            Done
          </button>
        </div>
      )}
    </ModalShell>
  );
}

// ── Shared modal shell ───────────────────────────
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "flex-end",
        background: "rgba(0,0,0,0.85)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          background: "#141414",
          borderRadius: "24px 24px 0 0",
          padding: "20px 16px 32px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Radio size={18} color="#FF4444" />
            <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 17 }}>Go Live</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color="#666" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Style constants ──────────────────────────────
const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 800,
  fontFamily: "Inter, sans-serif",
};

const camBtnStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "rgba(0,0,0,0.6)",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(8px)",
};
