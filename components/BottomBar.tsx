"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Fan, Volume2, VolumeX } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Glyph } from "./ui/Glyph";
import { useCar } from "@/lib/store";

export function BottomBar() {
  const s = useCar(useShallow((s) => ({
    set: s.set,
    openSheet: s.openSheet,
    sheet: s.sheet,
    tempL: s.tempL,
    tempR: s.tempR,
    sync: s.sync,
    seatL: s.seatL,
    seatR: s.seatR,
    fan: s.fan,
    auto: s.auto,
  })));

  const setTemp = (side: "L" | "R", d: number) => {
    const v = (x: number) => Math.round(Math.min(28, Math.max(16, x + d)) * 2) / 2;
    // Each side is its own zone. With SYNC on, the driver's side sets both; touching the
    // passenger side switches SYNC off, the way a dual-zone climate panel behaves.
    if (side === "L") s.set(s.sync ? { tempL: v(s.tempL), tempR: v(s.tempL) } : { tempL: v(s.tempL) });
    else s.set({ tempR: v(s.tempR), sync: false });
  };

  return (
    <footer className="relative z-30 flex h-[84px] shrink-0 items-center border-t border-white/[0.05] bg-[#0b0c0e] px-4">
      <div className="flex items-center gap-1">
        <DockBtn label="Home" onClick={() => s.openSheet("home")} active={s.sheet === "home"}>
          <Glyph id="apps" size={25} />
        </DockBtn>
        <div className="mx-3 h-8 w-px bg-white/[0.07]" />
        <Temp value={s.tempL} onUp={() => setTemp("L", 0.5)} onDown={() => setTemp("L", -0.5)} />
        <SeatHeat level={s.seatL} onClick={() => s.set({ seatL: (s.seatL + 1) % 4 })} />
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <button
          aria-label="Fan"
          onClick={() => s.openSheet("vehicle", "climate")}
          className="flex h-[52px] items-center gap-2 rounded-[14px] px-3.5 text-white/85 transition hover:bg-white/[0.05]"
        >
          <Fan
            size={20}
            strokeWidth={1.7}
            style={{ animation: s.fan ? `spin ${3.2 / s.fan}s linear infinite` : undefined }}
          />
          <span className="text-[13px] font-medium tracking-wide">{s.auto ? "AUTO" : `${s.fan}`}</span>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <SeatHeat level={s.seatR} onClick={() => s.set({ seatR: (s.seatR + 1) % 4 })} />
        <Temp value={s.tempR} onUp={() => setTemp("R", 0.5)} onDown={() => setTemp("R", -0.5)} />
        <div className="mx-3 h-8 w-px bg-white/[0.07]" />
        <Volume />
      </div>
    </footer>
  );
}

function DockBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative grid h-[52px] w-[58px] place-items-center rounded-[14px] transition hover:bg-white/[0.05] active:scale-95"
    >
      {children}
      <span
        className="absolute bottom-[3px] h-[3px] w-5 rounded-full bg-[#2f8fff] transition-opacity"
        style={{ opacity: active ? 1 : 0 }}
      />
    </button>
  );
}

function Temp({ value, onUp, onDown }: { value: number; onUp: () => void; onDown: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button aria-label="Cooler" onClick={onDown} className="grid h-11 w-9 place-items-center text-white/50 transition hover:text-white">
        <ChevronDown size={22} strokeWidth={1.8} />
      </button>
      <div className="relative w-[64px] overflow-hidden text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="block text-[26px] leading-none font-light text-white tabular-nums"
          >
            {value.toFixed(1)}
          </motion.span>
        </AnimatePresence>
        <span className="absolute top-0 right-0 text-[12px] text-white/40">°</span>
      </div>
      <button aria-label="Warmer" onClick={onUp} className="grid h-11 w-9 place-items-center text-white/50 transition hover:text-white">
        <ChevronUp size={22} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function SeatHeat({ level, onClick }: { level: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Seat heating ${level}`}
      className="flex h-[52px] w-[52px] flex-col items-center justify-center gap-1 rounded-[14px] transition hover:bg-white/[0.05]"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={level ? "#ff7a45" : "rgba(255,255,255,.7)"} strokeWidth="1.7" strokeLinecap="round">
        <path d="M7 3c1 2-1 3 0 5M11 3c1 2-1 3 0 5M15 3c1 2-1 3 0 5" opacity={level ? 1 : 0.6} />
        <path d="M6 12h9a3 3 0 0 1 3 3v2H8a2 2 0 0 1-2-2z" />
        <path d="M6 12 5 8M9 17v4M16 17v4" />
      </svg>
      <span className="flex gap-[3px]">
        {[1, 2, 3].map((i) => (
          <span key={i} className="h-[3px] w-[6px] rounded-full" style={{ background: i <= level ? "#ff7a45" : "rgba(255,255,255,.14)" }} />
        ))}
      </span>
    </button>
  );
}

function Volume() {
  const volume = useCar((s) => s.volume);
  const lastVolume = useCar((s) => s.lastVolume);
  const setVolume = useCar((s) => s.setVolume);
  return (
    <div className="flex items-center gap-1">
      <button
        aria-label="Volume down"
        onClick={() => setVolume(Math.max(0, volume - 6))}
        className="grid h-11 w-9 place-items-center text-white/50 hover:text-white"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        aria-label={volume ? "Mute" : "Unmute"}
        onClick={() => setVolume(volume ? 0 : lastVolume)}
        className="relative grid h-11 w-11 place-items-center text-white/85"
      >
        {volume ? <Volume2 size={21} strokeWidth={1.7} /> : <VolumeX size={21} strokeWidth={1.7} />}
        <span className="absolute bottom-0.5 h-[2px] w-7 rounded-full bg-white/10">
          <span className="block h-full rounded-full bg-white/70" style={{ width: `${volume}%` }} />
        </span>
      </button>
      <button
        aria-label="Volume up"
        onClick={() => setVolume(Math.min(100, volume + 6))}
        className="grid h-11 w-9 place-items-center text-white/50 hover:text-white"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
