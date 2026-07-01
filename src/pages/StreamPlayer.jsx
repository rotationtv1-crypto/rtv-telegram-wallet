/**
 * RotationTV Live — Cloudflare Stream Player Component
 * 
 * Uses @cloudflare/stream-react to play live streams and VOD content.
 * Install: npm i @cloudflare/stream-react
 * 
 * Usage:
 * <StreamPlayer src={videoIdOrSignedToken} poster={thumbnailUrl} />
 */

import { Stream } from "@cloudflare/stream-react";

export function StreamPlayer({ src, poster, autoplay = false, muted = true, onReady, onError }) {
  if (!src) {
    return (
      <div className="w-full aspect-video flex items-center justify-center" style={{ background: "#000" }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No stream</span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video overflow-hidden rounded-xl" style={{ background: "#000" }}>
      <Stream
        controls
        src={src}
        poster={poster}
        autoplay={autoplay}
        muted={muted}
        onReady={onReady}
        onError={onError}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

/**
 * Live Stream Card — shows a live stream with Cloudflare Stream player
 * Used in the DiscoverScreen feed
 */
export function LiveStreamCard({ stream, onClick }) {
  const streamSrc = stream.cloudflare_stream_id || stream.playback_url?.split("/").pop() || null;
  
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: "#141414", border: "1px solid rgba(204,255,0,0.1)" }}
      onClick={onClick}
    >
      {/* Stream Player or Thumbnail */}
      <div className="relative aspect-video" style={{ background: "#000" }}>
        {streamSrc ? (
          <Stream
            controls
            src={streamSrc}
            poster={stream.thumbnail_url}
            autoplay={false}
            muted={true}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📺</div>
        )}

        {/* LIVE badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(255,0,0,0.8)" }}>
          <span className="text-white text-xs font-bold">LIVE</span>
        </div>

        {/* Viewer count */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(0,0,0,0.6)" }}>
          <span className="text-white text-xs">{stream.viewer_count || 0} 👁</span>
        </div>
      </div>

      {/* Stream Info */}
      <div className="p-3">
        <h3 style={{ fontWeight: 600, fontSize: 14 }}>{stream.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            @{stream.creator_name || "creator"}
          </span>
          <div className="flex items-center gap-1">
            <span style={{ color: "#CCFF00", fontSize: 12, fontWeight: 600 }}>
              {stream.total_tips_rtv || 0} RTV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-screen stream viewer — opens when tapping a stream card
 */
export function StreamViewer({ stream, onClose }) {
  const streamSrc = stream.cloudflare_stream_id || stream.playback_url?.split("/").pop() || null;
  
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "#000" }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        <span style={{ color: "white", fontSize: 20 }}>✕</span>
      </button>

      {/* Stream Player */}
      <div className="flex-1 flex items-center justify-center">
        {streamSrc ? (
          <Stream
            controls
            src={streamSrc}
            poster={stream.thumbnail_url}
            autoplay={true}
            muted={false}
            style={{ width: "100%", height: "100%", maxWidth: "100vw" }}
          />
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">📡</div>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Stream is loading...</p>
          </div>
        )}
      </div>

      {/* Stream info bar */}
      <div className="p-4" style={{ background: "rgba(10,10,10,0.95)" }}>
        <h2 style={{ fontWeight: 700, fontSize: 16, color: "white" }}>{stream.title}</h2>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full" style={{ background: "#CCFF00" }} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              @{stream.creator_name || "creator"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: "#CCFF00", fontSize: 14, fontWeight: 700 }}>
              {stream.viewer_count || 0} viewers
            </span>
            <span style={{ color: "#FF006E", fontSize: 14, fontWeight: 700 }}>
              {stream.total_tips_rtv || 0} RTV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}