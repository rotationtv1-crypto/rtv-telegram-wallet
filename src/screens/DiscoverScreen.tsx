import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stream } from "@cloudflare/stream-react";
import { Eye } from "lucide-react";
import { useStore, type ActiveStream } from "../store/useStore";

interface StreamData {
  id: string;
  stream_id?: string;
  title: string;
  category: string;
  viewer_count: number;
  total_tips_rtv: number;
  creator_id?: string;
  creator_name?: string;
  thumbnail_url?: string;
  cloudflare_stream_id?: string;
  playback_url?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function DiscoverScreen() {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const setActiveStream = useStore((s) => s.setActiveStream);

  useEffect(() => { fetchLiveStreams(); }, []);

  const fetchLiveStreams = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/streams/live`);
      const data = await resp.json();
      setStreams(data.streams || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getSrc = (s: StreamData) => s.cloudflare_stream_id || (s.playback_url?.split("/").pop() || null);

  // Opens the ONE shared, full-featured stream viewer (StreamViewer + AgentChat +
  // flying gifts) rendered globally in App.tsx — previously this screen opened its
  // own separate, bare-bones modal with no chat and no gift sending, so tapping a
  // live stream from Discover (the only place streams are listed) never reached
  // the real viewer at all.
  const openStream = (s: StreamData) => {
    const active: ActiveStream = {
      id: s.id,
      stream_id: s.stream_id || s.id,
      title: s.title,
      creator_id: s.creator_id,
      creator_name: s.creator_name,
      viewer_count: s.viewer_count,
      total_tips_rtv: s.total_tips_rtv,
      cloudflare_stream_id: s.cloudflare_stream_id,
      playback_url: s.playback_url,
    };
    setActiveStream(active);
  };

  if (loading) return <div className="flex items-center justify-center h-full text-white">Loading...</div>;

  if (streams.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
      <div className="text-5xl">🔴</div>
      <div className="text-white font-bold text-xl">No live streams yet</div>
      <div className="text-gray-400 text-sm">Tap lightning to go live!</div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="text-white font-black text-xl mb-4">🔴 Live Now ({streams.length})</div>
      <div className="grid grid-cols-2 gap-3">
        {streams.map((s, i) => {
          const src = getSrc(s);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{ background: "#141414" }}
              onClick={() => openStream(s)}
            >
              <div className="aspect-video relative">
                {src ? <Stream src={src} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📺</div>}
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-md">LIVE</div>
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-xs bg-black/60 px-2 py-0.5 rounded-full">
                  <Eye size={10} />{s.viewer_count || 0}
                </div>
              </div>
              <div className="p-2">
                <div className="text-white font-bold text-sm truncate">{s.title}</div>
                <div className="text-gray-400 text-xs">@{s.creator_name || "creator"}</div>
                <div className="text-yellow-400 text-xs mt-1">{s.total_tips_rtv || 0} RTV</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
