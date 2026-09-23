"use client";

import { motion } from "motion/react";
import { TRACKS, useCar } from "@/lib/store";

/** Generated cover art, keyed to the track hue (no copyrighted artwork). */
export function AlbumArt({ size, radius = 10 }: { size: number; radius?: number }) {
  const track = useCar((s) => s.track);
  const h = TRACKS[track].hue;
  return (
    <motion.div
      key={track}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `radial-gradient(circle at 28% 24%, hsl(${h} 75% 64% / .95), transparent 52%),
          radial-gradient(circle at 82% 88%, hsl(${(h + 40) % 360} 70% 42% / .9), transparent 60%),
          conic-gradient(from ${h}deg at 60% 40%, hsl(${h} 45% 12%), hsl(${(h + 60) % 360} 55% 28%), hsl(${h} 45% 9%))`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
      }}
    >
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{ background: "repeating-linear-gradient(115deg, rgba(255,255,255,.07) 0 2px, transparent 2px 9px)" }}
      />
    </motion.div>
  );
}
