"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { TRACKS, useCar } from "@/lib/store";

const BLOBS = [
  { x: -30, y: -35, dx: "14%", dy: "10%", s: 13, d: 2 },
  { x: 30, y: -25, dx: "-12%", dy: "16%", s: 17, d: 7 },
  { x: -25, y: 35, dx: "16%", dy: "-12%", s: 15, d: 4 },
  { x: 35, y: 40, dx: "-14%", dy: "-10%", s: 19, d: 10 },
];

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AlbumArt({ size, radius = 10, track }: { size: number; radius?: number; track?: number }) {
  const current = useCar((s) => s.track);
  const playing = useCar((s) => s.playing);
  const index = track ?? current;
  const [base, ...colors] = TRACKS[index].mesh;
  const live = track === undefined && playing;
  const remSize = Math.round((size / 16) * 20) / 20;
  const remRadius = Math.round((radius / 16) * 20) / 20;
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative shrink-0 overflow-hidden"
      style={{ width: `${remSize}rem`, height: `${remSize}rem`, borderRadius: `${remRadius}rem`, background: base }}
    >
      {colors.map((c, i) => {
        const b = BLOBS[i];
        return (
          <span
            key={i}
            className="absolute h-full w-full animate-[drift_15s_ease-in-out_infinite_alternate] rounded-full motion-reduce:animate-none"
            style={
              {
                left: `${b.x}%`,
                top: `${b.y}%`,
                background: `radial-gradient(circle, ${c} 0%, color-mix(in oklab, ${c} 55%, transparent) 30%, transparent 66%)`,
                animationDuration: `${b.s}s`,
                animationDelay: `-${b.d}s`,
                animationPlayState: live ? "running" : "paused",
                "--dx": b.dx,
                "--dy": b.dy,
              } as CSSProperties
            }
          />
        );
      })}
      <div className="absolute inset-0 opacity-[0.16] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_0.05rem_rgba(255,255,255,0.08)]" />
    </motion.div>
  );
}
