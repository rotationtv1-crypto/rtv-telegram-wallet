import { Stream } from "@cloudflare/stream-react";
import { Eye, Gift, X } from "lucide-react";

export function StreamPlayer({ src, poster, autoplay = false, muted = true, onReady, onError }) {
  if (!src) return (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
      No stream
    </div>
  );
  return (
    <Stream
      src={src}
      poster={poster}
      autoplay={autoplay}
      muted={muted}
      onStreamAdEvent={onReady}
      className="w-full h-full object-cover"
    />
  );
}

export function LiveStreamCard({ stream, onClick }) {
  const src = stream.cloudflare_stream_id || (stream.playback_url?.split("/").pop() || null);
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: "#141414" }}
      onClick={onClick}
    >
      <div className="aspect-video relative">
        {src ? (
          <Stream src={src} className="w-full h-full object-cover" muted autoplay />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📺</div>
        )}
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-md">LIVE</div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-xs bg-black/60 px-2 py-0.5 rounded-full">
          <Eye size={10} />{stream.viewer_count || 0}
        </div>
      </div>
      <div className="p-3">
        <div className="text-white font-bold text-sm truncate">{stream.title}</div>
        <div className="text-gray-400 text-xs">@{stream.creator_name || "creator"}</div>
        <div className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
          <Gift size={10} />{stream.total_tips_rtv || 0} RTV
        </div>
      </div>
    </div>
  );
}

export function StreamViewer({ stream, onClose }) {
  const src = stream?.cloudflare_stream_id || (stream?.playback_url?.split("/").pop() || null);
  return (
    <div className="flex-1 relative" style={{ background: "#000" }}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        <X size={18} color="white" />
      </button>

      {src ? (
        <Stream src={src} autoplay muted className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
          <div className="text-4xl">📡</div>
          <div className="text-sm">Stream loading...</div>
        </div>
      )}

      {stream && (
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }}
        >
          <div className="text-white font-bold">{stream.title}</div>
          <div className="text-gray-400 text-sm">@{stream.creator_name || "creator"}</div>
          <div className="flex gap-4 mt-1 text-sm">
            <span className="text-white flex items-center gap-1"><Eye size={12} />{stream.viewer_count || 0} viewers</span>
            <span className="text-yellow-400 flex items-center gap-1"><Gift size={12} />{stream.total_tips_rtv || 0} RTV</span>
          </div>
        </div>
      )}
    </div>
  );
}
