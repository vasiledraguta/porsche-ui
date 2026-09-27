"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { Fuel, Lock, LockOpen, Move3d, RotateCcw } from "lucide-react";
import { MiniPlayer } from "./MiniPlayer";
import { useSlider } from "./ui/useSlider";

// WebGL only runs client-side.
const Car3D = dynamic(() => import("./Car3D"), { ssr: false });
import { MODES, MODE_ORDER, REDLINE, rangeFor, useCar } from "@/lib/store";

/** Left vehicle column: PDK gear, fuel, the 3D 911 GT3 RS when parked or the instrument cluster when driving, drive mode, media. */
export function CarPanel() {
  return (
    <section className="relative z-20 flex w-[540px] shrink-0 flex-col bg-[#0e1013]">
      <DriveHeader />
      <CarStage />
      <ModeBar />
      <div className="px-5 pb-5">
        <MiniPlayer />
      </div>
    </section>
  );
}

const DIAL_START = -135;
const DIAL_SWEEP = 270;

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return [150 + r * Math.sin(a), 150 - r * Math.cos(a)] as const;
}

function arc(from: number, to: number, r: number) {
  const [x1, y1] = polar(from, r);
  const [x2, y2] = polar(to, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

const rpmDeg = (rpm: number) => DIAL_START + (Math.min(rpm, REDLINE) / REDLINE) * DIAL_SWEEP;

function DriveHeader() {
  const speed = useCar((s) => s.speed);
  const gear = useCar((s) => s.gear);
  const pdkGear = useCar((s) => s.pdkGear);
  const rpm = useCar((s) => s.rpm);
  const fuel = useCar((s) => s.fuel);
  const mode = useCar((s) => s.mode);
  const set = useCar((s) => s.set);
  const parked = gear === "P";

  return (
    <div className="flex items-start justify-between px-7 pt-6">
      <div>
        <div className="flex gap-3 text-[15px] font-medium">
          {(["P", "N", "D"] as const).map((g) => (
            <button
              key={g}
              disabled={g === "P" && speed > 0}
              onClick={() => set({ gear: g })}
              className={g === gear ? "text-white" : "text-white/25 hover:text-white/50 disabled:cursor-not-allowed disabled:opacity-40"}
            >
              {g === "D" && gear === "D" ? `D${pdkGear}` : g}
            </button>
          ))}
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: parked ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          aria-hidden={!parked}
          className="mt-1.5 flex h-6 items-center gap-2 text-[13px] text-white/45 tabular-nums"
        >
          <span>{Math.round(speed)} km/h</span>
          <span className="text-white/20">·</span>
          <span>{(Math.round(rpm / 50) * 50).toLocaleString("en")} rpm</span>
          {rpm === 0 && <StartStop />}
        </motion.div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-[15px] font-medium text-white tabular-nums">{Math.round(fuel)}%</span>
          <FuelGauge pct={fuel} />
        </div>
        <div className="mt-1 text-[13px] text-white/45 tabular-nums">{rangeFor(fuel, mode)} km</div>
      </div>
    </div>
  );
}

function StartStop() {
  return (
    <span role="status" aria-label="Auto start/stop active" className="rounded border border-[#4ca765] px-1.5 py-0.5 text-[11px] leading-none font-semibold text-[#75d28b]">
      A
    </span>
  );
}

function Cluster() {
  const speed = useCar((s) => s.speed);
  const gear = useCar((s) => s.gear);
  const pdkGear = useCar((s) => s.pdkGear);
  const rpm = useCar((s) => s.rpm);
  const shift = rpm > 8300;
  const pct = Math.min(1, rpm / REDLINE);
  const needle = rpmDeg(rpm);
  const [n1x, n1y] = polar(needle, 44);
  const [n2x, n2y] = polar(needle, 124);

  return (
    <div className="relative h-[300px] w-[300px]">
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d={arc(DIAL_START, DIAL_START + DIAL_SWEEP, 134)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={4} />
        <path d={arc(rpmDeg(8000), DIAL_START + DIAL_SWEEP, 134)} fill="none" stroke="#ff3b30" strokeOpacity={0.55} strokeWidth={4} />
        <path
          d={arc(DIAL_START, DIAL_START + DIAL_SWEEP, 134)}
          pathLength={1}
          strokeDasharray={`${pct} 1`}
          fill="none"
          stroke={shift ? "#ff3b30" : pct > 0.78 ? "#ffb020" : "#f2f4f7"}
          strokeWidth={4}
        />
        {Array.from({ length: 19 }, (_, i) => {
          const r = i * 500;
          const major = i % 2 === 0;
          const [x1, y1] = polar(rpmDeg(r), 126);
          const [x2, y2] = polar(rpmDeg(r), major ? 112 : 119);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={r >= 8000 ? "#ff3b30" : major ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)"}
              strokeWidth={major ? 2 : 1.2}
            />
          );
        })}
        {Array.from({ length: 10 }, (_, k) => {
          const [x, y] = polar(rpmDeg(k * 1000), 97);
          return (
            <text
              key={k}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fill={k >= 8 ? "#ff6b61" : "rgba(255,255,255,0.6)"}
              className="tabular-nums"
            >
              {k}
            </text>
          );
        })}
        <text x={150} y={214} textAnchor="middle" fontSize={10} letterSpacing={0.6} fill="rgba(255,255,255,0.35)">
          × 1000 rpm
        </text>
        <line x1={n1x} y1={n1y} x2={n2x} y2={n2y} stroke="#ff4b2b" strokeWidth={3} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-x-0 top-[92px] flex flex-col items-center">
        <span className="text-[76px] leading-none font-normal text-white tabular-nums">{Math.round(speed)}</span>
        <span className="mt-1.5 text-[13px] text-white/45">km/h</span>
      </div>
      <div className="absolute bottom-[10px] left-1/2 flex -translate-x-1/2 items-center gap-2">
        <span
          className={`grid h-11 min-w-11 place-items-center rounded-[10px] border px-2 text-[26px] leading-none font-medium tabular-nums transition-colors ${
            shift ? "border-[#ff3b30] text-[#ff6b61]" : "border-white/15 text-white"
          }`}
        >
          {gear === "D" ? pdkGear : gear}
        </span>
        {rpm === 0 && <StartStop />}
      </div>
    </div>
  );
}

function FuelGauge({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <Fuel size={14} strokeWidth={1.8} className={pct < 12 ? "text-[#ffb020]" : "text-white/55"} />
      <span className="relative h-[5px] w-[30px] overflow-hidden rounded-full bg-white/12">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: pct < 12 ? "#ffb020" : "#f2f4f7" }}
        />
      </span>
    </span>
  );
}

/** Spinnable 3D car with openable lids/doors, lock and view controls overlaid. */
function CarStage() {
  const locked = useCar((s) => s.locked);
  const lift = useCar((s) => s.lift);
  const drs = useCar((s) => s.drs);
  const set = useCar((s) => s.set);
  const toggleLock = useCar((s) => s.toggleLock);
  const anyOpen = useCar((s) => s.frunkOpen || s.trunkOpen || s.doorL || s.doorR);
  const driving = useCar((s) => s.gear !== "P");
  return (
    <div className="relative mx-2 mt-1 flex-1 overflow-hidden rounded-[18px]">
      <motion.div
        initial={false}
        animate={{ opacity: driving ? 0 : 1, scale: driving ? 0.94 : 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        inert={driving}
        className="absolute inset-0"
      >
        {/* floor glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(55%_45%_at_50%_70%,rgba(255,255,255,0.06),transparent_70%)]" />
        <Car3D />
        <div className="pointer-events-none absolute top-3.5 left-4 leading-tight">
          <div className="text-[13px] font-medium tracking-[0.02em] text-white/85">911 GT3 RS</div>
          <div className="text-[11px] text-white/35">992 · GT Silver Metallic</div>
        </div>
        <div className="pointer-events-none absolute bottom-2 left-4 flex items-center gap-1.5 text-[11px] text-white/30">
          <Move3d size={13} strokeWidth={1.6} /> Drag to rotate · tap a part to open
        </div>
        <button
          onClick={() => set({ carViewReset: Date.now() })}
          aria-label="Reset view"
          className="absolute right-3 bottom-2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
        >
          <RotateCcw size={14} strokeWidth={1.8} />
        </button>
        <AnimatePresence>
          {lift && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-4 rounded-full bg-(--ambient)/15 px-3 py-1 text-[12px] text-(--ambient)"
            >
              Lift active
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence initial={false}>
        {driving && (
          <motion.div
            key="cluster"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 grid place-items-center pt-6"
          >
            <Cluster />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button
          onClick={toggleLock}
          aria-label={locked ? "Unlock" : "Lock"}
          className="flex items-center gap-2 rounded-full bg-black/40 py-[7px] pr-3.5 pl-3 text-[12.5px] backdrop-blur-sm transition hover:bg-black/60"
        >
          {locked ? (
            <Lock size={15} strokeWidth={1.9} className="text-white" />
          ) : (
            <LockOpen size={15} strokeWidth={1.9} className="text-(--ambient) transition-colors" />
          )}
          <span className={`transition-colors ${locked ? "text-white" : "text-(--ambient)"}`}>{locked ? "Locked" : anyOpen ? "Open" : "Unlocked"}</span>
        </button>
        <button
          onClick={() => set({ drs: !drs })}
          aria-pressed={drs}
          className="rounded-full bg-black/40 px-3.5 py-[7px] text-[12.5px] font-medium tracking-[0.06em] backdrop-blur-sm transition hover:bg-black/60"
        >
          <span className={`transition-colors ${drs ? "text-(--ambient)" : "text-white"}`}>DRS</span>
        </button>
      </div>
    </div>
  );
}

function ModeBar() {
  const mode = useCar((s) => s.mode);
  const setMode = useCar((s) => s.setMode);
  const { container, indicator } = useSlider(MODE_ORDER.indexOf(mode));
  return (
    <div className="px-5 pb-3">
      <div ref={container} className="relative flex rounded-[12px] bg-white/[0.05] p-[3px]">
        <span
          ref={indicator}
          className="pointer-events-none absolute top-0 left-0 rounded-[9px] bg-[#262a30] opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_2px_8px_rgba(0,0,0,0.4)]"
        />
        {MODE_ORDER.map((m) => (
          <button key={m} data-slot onClick={() => setMode(m)} className="relative flex-1 rounded-[9px] py-[9px] text-[13.5px]">
            <span className={`relative ${mode === m ? "text-white" : "text-white/50"}`}>{MODES[m].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
