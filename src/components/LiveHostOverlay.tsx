/**
 * ROTATIONTVNETWORK LLC — LIVE HOST OVERLAY
 * Transparent overlay for live streams: name badge, LIVE badge, mic meter, viewer count
 * Drop onto any <video> or stream container with relative positioning
 * DO NOT CHANGE design tokens (colors, fonts, radius)
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveHostOverlayProps {
  hostName: string;
  handle: string;
  viewerCount: number;
  streamStartTime: Date;
  isLive: boolean;
  avatarUrl?: string;
  showMicMeter?: boolean;
}

export function LiveHostOverlay({
  hostName,
  handle,
  viewerCount,
  streamStartTime,
  isLive,
  avatarUrl,
  showMicMeter = true,
}: LiveHostOverlayProps) {
  const [duration, setDuration] = useState("00:00");
  const [micLevel, setMicLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Stream timer
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - streamStartTime.getTime()) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setDuration(
        h > 0
          ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
          : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, streamStartTime]);

  // Mic meter via Web Audio API
  useEffect(() => {
    if (!isLive || !showMicMeter) return;
    let mediaStream: MediaStream;
    (async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(mediaStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setMicLevel(Math.min(100, avg * 2.5));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // mic denied — meter stays at 0
      }
    })();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, [isLive, showMicMeter]);

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString());

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ fontFamily: "Inter, sans-serif", zIndex: 10 }}>
      {/* LIVE badge + timer */}
      <AnimatePresence>
        {isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 8 }}
          >
            <motion.div
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF4444", boxShadow: "0 0 8px #FF4444, 0 0 16px #FF444488" }}
            />
            <span style={{
              background: "#FF4444",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              padding: "2px 8px",
              borderRadius: 6,
            }}>LIVE</span>
            <span style={{
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 12,
              padding: "2px 10px",
              borderRadius: 6,
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>{duration}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewer count */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 8,
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}>
        <span>👁</span>
        <span style={{ fontWeight: 600 }}>{fmt(viewerCount)}</span>
      </div>

      {/* Host badge + mic meter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          position: "absolute",
          bottom: 16,
          left: 12,
          background: "rgba(13,13,13,0.72)",
          backdropFilter: "blur(14px)",
          borderRadius: 12,
          padding: "10px 14px",
          border: "1px solid rgba(108,92,231,0.4)",
          boxShadow: "0 0 20px rgba(108,92,231,0.2)",
          minWidth: 170,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={hostName}
              style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #6C5CE7" }} />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: "#fff"
            }}>
              {hostName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{hostName}</div>
            <div style={{ color: "#A29BFE", fontSize: 11, marginTop: 1 }}>@{handle}</div>
          </div>
        </div>

        {/* Mic level bar */}
        {showMicMeter && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              height: 3,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              overflow: "hidden",
            }}>
              <motion.div
                animate={{ width: `${micLevel}%` }}
                transition={{ duration: 0.06 }}
                style={{
                  height: "100%",
                  borderRadius: 2,
                  background: micLevel > 70 ? "#FF6B6B" : micLevel > 40 ? "#FDCB6E" : "#00CEC9",
                }}
              />
            </div>
            <div style={{ color: "#555", fontSize: 10, marginTop: 3, letterSpacing: "0.05em" }}>
              🎙 {micLevel < 5 ? "MUTED" : "MIC ACTIVE"}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
