"use client";

import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Fuel, Lock, LockOpen, Move3d, RotateCcw } from "lucide-react";
import { MiniPlayer } from "./MiniPlayer";
import { useSlider } from "./ui/useSlider";

// WebGL only runs client-side.
const Car3D = dynamic(() => import("./Car3D"), { ssr: false });
import { MODES, MODE_ORDER, REDLINE, rangeFor, useCar } from "@/lib/store";

/** Left vehicle column: speed, PDK gear, rev bar, fuel, the 3D 911 GT3 RS, lock/view controls, drive mode, media. */
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

function DriveHeader() {
  const speed = useCar((s) => s.speed);
  const gear = useCar((s) => s.gear);
  const pdkGear = useCar((s) => s.pdkGear);
  const rpm = useCar((s) => s.rpm);
  const fuel = useCar((s) => s.fuel);
  const mode = useCar((s) => s.mode);
  const set = useCar((s) => s.set);
  const shift = rpm > 8300;

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
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[64px] leading-[0.9] font-light tracking-[-0.03em] text-white tabular-nums">
            {Math.round(speed)}
          </span>
          <span className="text-[14px] text-white/45">km/h</span>
        </div>
      </div>
      <RevCounter rpm={rpm} shift={shift} />
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

const TACHO = { cx: 88, cy: 80, r: 72, sweep: 240 };

function tachoAngle(rpm: number) {
  return -TACHO.sweep / 2 + (Math.min(Math.max(rpm, 0), REDLINE) / REDLINE) * TACHO.sweep;
}

function tachoPoint(angle: number, r: number) {
  const t = (angle * Math.PI) / 180;
  return [TACHO.cx + r * Math.sin(t), TACHO.cy - r * Math.cos(t)] as const;
}

function tachoArc(from: number, to: number, r: number) {
  const a = tachoAngle(from);
  const b = tachoAngle(to);
  const [x1, y1] = tachoPoint(a, r);
  const [x2, y2] = tachoPoint(b, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Porsche centre rev counter, 0–9,000 rpm. The last 1,000 rpm is the red zone; the needle turns red at the shift point. */
function RevCounter({ rpm, shift }: { rpm: number; shift: boolean }) {
  const { cx, cy, r } = TACHO;
  const pct = Math.min(1, rpm / REDLINE);
  const red = REDLINE - 1000;
  const needle = useSpring(rpm, { stiffness: 300, damping: 35 });
  useEffect(() => {
    needle.set(rpm);
  }, [needle, rpm]);
  const sweep = useTransform(needle, (v) => tachoArc(0, v, r - 4));
  const hand = useTransform(needle, (v) => {
    const a = tachoAngle(v);
    const [x1, y1] = tachoPoint(a, -10);
    const [x2, y2] = tachoPoint(a, r - 5);
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  });
  const readout = (Math.round(rpm / 50) * 50).toLocaleString("en");
  return (
    <svg
      width={176}
      height={124}
      viewBox="0 0 176 124"
      role="img"
      aria-label={`${readout} rpm`}
      className="-mt-2 shrink-0 tabular-nums"
    >
      <path d={tachoArc(0, red, r)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      <path d={tachoArc(red, REDLINE, r)} fill="none" stroke="#ff3b30" strokeWidth={3} />
      <motion.path
        d={sweep}
        fill="none"
        stroke={shift ? "#ff3b30" : pct > 0.78 ? "#ffb020" : "rgba(255,255,255,0.3)"}
        strokeWidth={2}
      />
      {Array.from({ length: REDLINE / 500 + 1 }, (_, i) => {
        const v = i * 500;
        const major = v % 1000 === 0;
        const a = tachoAngle(v);
        const [x1, y1] = tachoPoint(a, r);
        const [x2, y2] = tachoPoint(a, r - (major ? 8 : 4));
        return (
          <line
            key={v}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={v >= red ? "#ff3b30" : major ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"}
            strokeWidth={major ? 1.5 : 1}
          />
        );
      })}
      {Array.from({ length: REDLINE / 1000 + 1 }, (_, i) => {
        const [x, y] = tachoPoint(tachoAngle(i * 1000), r - 17);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10.5}
            fill={i * 1000 >= red ? "#ff6b61" : "rgba(255,255,255,0.6)"}
          >
            {i}
          </text>
        );
      })}
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={11} fill={shift ? "#ff6b61" : "rgba(255,255,255,0.6)"}>
        {readout} rpm
      </text>
      <motion.path d={hand} fill="none" stroke={shift ? "#ff3b30" : "#fff"} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#0e1013" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
    </svg>
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
  const set = useCar((s) => s.set);
  const anyOpen = useCar((s) => s.frunkOpen || s.trunkOpen || s.doorL || s.doorR);
  return (
    <div className="relative mx-2 mt-1 flex-1 overflow-hidden rounded-[18px]">
      {/* floor glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(55%_45%_at_50%_70%,rgba(255,255,255,0.06),transparent_70%)]" />
      <Car3D />
      <div className="pointer-events-none absolute top-3.5 left-4 leading-tight">
        <div className="text-[13px] font-medium tracking-[0.02em] text-white/85">911 GT3 RS</div>
        <div className="text-[11px] text-white/35">992 · GT Silver Metallic</div>
      </div>
      <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button
          onClick={() => set({ locked: !locked, ...(locked ? {} : { frunkOpen: false, trunkOpen: false, doorL: false, doorR: false }) })}
          aria-label={locked ? "Unlock" : "Lock"}
          className="flex items-center gap-2 rounded-full bg-black/40 py-[7px] pr-3.5 pl-3 text-[12.5px] backdrop-blur-sm transition hover:bg-black/60"
        >
          {locked ? (
            <Lock size={15} strokeWidth={1.9} className="text-white" />
          ) : (
            <LockOpen size={15} strokeWidth={1.9} className="text-[#2f8fff]" />
          )}
          <span className={locked ? "text-white" : "text-[#6db3ff]"}>{locked ? "Locked" : anyOpen ? "Open" : "Unlocked"}</span>
        </button>
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
            className="absolute top-3 right-4 rounded-full bg-[#2f8fff]/15 px-3 py-1 text-[12px] text-[#6db3ff]"
          >
            Lift active
          </motion.div>
        )}
      </AnimatePresence>
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
