/**
 * ROTATIONTVNETWORK LLC — FLYING GIFT OVERLAY
 * Renders animated flying gifts over a live stream when a tip is broadcast.
 * Uses the SAME locked design tokens as LiveHostOverlay (#6C5CE7 / #A29BFE /
 * #00CEC9) — do not introduce new colors here.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { TipEvent } from "../hooks/useStreamRoom";

interface FlyingGiftProps {
  tips: TipEvent[];
  onDone: (id: string) => void;
}

export function FlyingGift({ tips, onDone }: FlyingGiftProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 20 }}>
      <AnimatePresence>
        {tips.map((tip) => {
          const drift = Math.random() * 160 - 80; // -80..80px horizontal drift
          return (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -420, x: drift, scale: [0.6, 1.15, 1, 0.9] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, ease: "easeOut" }}
              onAnimationComplete={() => onDone(tip.id)}
              style={{
                position: "absolute",
                left: `${20 + Math.random() * 60}%`,
                bottom: 90,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 44, filter: "drop-shadow(0 0 12px rgba(108,92,231,0.6))" }}>
                {tip.gift_emoji}
              </div>
              <div
                style={{
                  background: "rgba(13,13,13,0.75)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(108,92,231,0.4)",
                  borderRadius: 10,
                  padding: "3px 10px",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#A29BFE" }}>{tip.username}</span>{" "}
                <span style={{ color: "#FDCB6E" }}>+{tip.tip_amount_rtv} RTV</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
