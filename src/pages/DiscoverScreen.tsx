/**
 * RotationTV Live — DiscoverScreen with Cloudflare Stream Player
 * 
 * Uses @cloudflare/stream-react for in-feed video playback.
 * Each live stream card embeds a Cloudflare Stream player.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stream } from "@cloudflare/stream-react";
import { Eye, Gift, X } from "lucide-react";

interface StreamData {
  id: string;
  title: string;
  category: string;
  viewer_count: number;
  total_tips_rtv: number;
  creator_name?: string;
  thumbnail_url?: string;
  cloudflare_stream_id?: string;
  playback_url?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function DiscoverScreen() {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState<StreamData | null>(null);

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  const fetchLiveStreams = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/streams/live`);
      const data = await resp.json();
      setStreams(data.streams || []);
    } catch (err) {
      console.error("Failed to fetch streams:", err);
    }
    setLoading(false);
  };

  const getStreamSrc = (s: StreamData) => {
    return s.cloudflare_stream_id || (s.playback_url?.split("/").pop() || null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="animate-pulse" style={{ color: "#CCFF00" }}>Loading live streams...</span>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 px-6 text-center">
        <div className="text-5xl mb-4">🔴</div>
        <h2 style={{ color: "#CCFF00", fontWeight: 700, fontSize: 18 }}>No live streams yet</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 8 }}>
          Tap the lightning button to go live and be the first!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Stream Feed */}
      <div className="px-4 py-3 space-y-3">
        <h2 style={{ fontWeight: 700, fontSize: 16, color: "#CCFF00" }}>
          🔴 Live Now ({streams.length})
        </h2>

        {streams.map((s, i) => {
          const src = getStreamSrc(s);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#141414", border: "1px solid rgba(204,255,0,0.1)" }}
              onClick={() => setActiveStream(s)}
            >
              {/* Cloudflare Stream Player or Thumbnail */}
              <div className="relative aspect-video" style={{ background: "#000" }}>
                {src ? (
                  <Stream
                    controls
                    src={src}
                    poster={s.thumbnail_url}
                    muted
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📺</div>
                )}

                {/* LIVE badge */}
                <div
                  className="absolute top-2 left-2 px-2 py-1 rounded-full"
                  style={{ background: "rgba(255,0,0,0.8)" }}
                >
                  <span className="text-white text-xs font-bold">LIVE</span>
                </div>

                {/* Viewer count */}
                <div
                  className="absolute top-2 right-2 px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  <Eye size={12} color="white" />
                  <span className="text-white text-xs">{s.viewer_count || 0}</span>
                </div>
              </div>

              {/* Stream info */}
              <div className="p-3">
                <h3 style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    @{s.creator_name || "creator"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Gift size={14} color="#CCFF00" />
                    <span style={{ color: "#CCFF00", fontSize: 12, fontWeight: 600 }}>
                      {s.total_tips_rtv || 0} RTV
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full-screen Stream Viewer */}
      <AnimatePresence>
        {activeStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col"
            style={{ background: "#000" }}
          >
            {/* Close */}
            <button
              onClick={() => setActiveStream(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X size={22} color="white" />
            </button>

            {/* Player */}
            <div className="flex-1 flex items-center justify-center">
              {getStreamSrc(activeStream) ? (
                <Stream
                  controls
                  src={getStreamSrc(activeStream)!}
                  poster={activeStream.thumbnail_url}
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div className="text-center">
                  <div className="text-5xl mb-4">📡</div>
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>Stream loading...</p>
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="p-4" style={{ background: "rgba(10,10,10,0.95)" }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: "white" }}>{activeStream.title}</h2>
              <div className="flex items-center justify-between mt-2">
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  @{activeStream.creator_name || "creator"}
                </span>
                <div className="flex items-center gap-3">
                  <span style={{ color: "#CCFF00", fontSize: 14, fontWeight: 700 }}>
                    {activeStream.viewer_count || 0} viewers
                  </span>
                  <span style={{ color: "#FF006E", fontSize: 14, fontWeight: 700 }}>
                    {activeStream.total_tips_rtv || 0} RTV
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}