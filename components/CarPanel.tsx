"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { Fuel, Lock, LockOpen, Move3d, RotateCcw } from "lucide-react";
import { MiniPlayer } from "./MiniPlayer";
import { useSlider } from "./ui/useSlider";

// WebGL only runs client-side.
const Car3D = dynamic(() => import("./Car3D"), { ssr: false });
import { MODES, MODE_ORDER, REDLINE, rangeFor, useCar } from "@/lib/store";

/** Left vehicle column: PDK gear, fuel, the 3D 911 GT3 RS with a rev counter over a chase view when driving, drive mode, media. */
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

const DIAL_MAX = 10000;
const DIAL_START = -116.5;
const DIAL_SWEEP = 233;
const SHIFT_FROM = 6000;
const SHIFT_AT = 8300;
const WINDOW_TOP = 42;
const WINDOW_R = 94;
const WINDOW_HALF = Math.sqrt(WINDOW_R ** 2 - WINDOW_TOP ** 2);

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)] as const;
}

function arc(from: number, to: number, r: number) {
  const [x1, y1] = polar(from, r);
  const [x2, y2] = polar(to, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

const rpmDeg = (rpm: number) => DIAL_START + (Math.min(Math.max(rpm, 0), DIAL_MAX) / DIAL_MAX) * DIAL_SWEEP;

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
  const shift = rpm >= SHIFT_AT;
  const fill = Math.min(1, Math.max(0, (rpm - SHIFT_FROM) / (SHIFT_AT - SHIFT_FROM)));

  return (
    <div className="flex items-center gap-5">
      <ShiftBar fill={fill} shift={shift} />
      <svg viewBox="-160 -160 320 320" className="h-[300px] w-[300px]" aria-hidden style={{ fontVariantNumeric: "tabular-nums" }}>
        <defs>
          <radialGradient id="tach-face">
            <stop offset="0" stopColor="#17181b" />
            <stop offset="1" stopColor="#08090a" />
          </radialGradient>
          <linearGradient id="tach-bezel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8b9096" />
            <stop offset="0.5" stopColor="#232428" />
            <stop offset="1" stopColor="#5d6167" />
          </linearGradient>
        </defs>
        <circle r={155} fill="none" stroke="url(#tach-bezel)" strokeWidth={6} />
        <circle r={152} fill="url(#tach-face)" />
        <circle r={111} fill="none" stroke="#18191d" strokeWidth={33} />
        {[98, 104, 118, 124].map((r) => (
          <circle key={r} r={r} fill="none" stroke="rgba(255,255,255,0.035)" />
        ))}
        <path d={arc(rpmDeg(REDLINE), rpmDeg(DIAL_MAX), 141)} fill="none" stroke="#e5322b" strokeWidth={3} />
        {Array.from({ length: 21 }, (_, i) => {
          const deg = rpmDeg(i * 500);
          const red = i * 500 >= REDLINE;
          if (i % 2 === 0) {
            const [x1, y1] = polar(deg, 133);
            const [x2, y2] = polar(deg, 146);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={red ? "#e5322b" : "#e9ecef"} strokeWidth={3} />;
          }
          const [x, y] = polar(deg, 142);
          return <circle key={i} cx={x} cy={y} r={1.8} fill={red ? "#e5322b" : "rgba(233,236,239,0.8)"} />;
        })}
        {Array.from({ length: 11 }, (_, k) => {
          const [x, y] = polar(rpmDeg(k * 1000), 111);
          return (
            <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={500} fill="#f2f4f7">
              {k}
            </text>
          );
        })}
        <text y={-40} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={700} fontStyle="italic" letterSpacing={0.5} fill="#f2f4f7">
          GT3 RS
        </text>
        <path
          d={`M ${-WINDOW_HALF} ${WINDOW_TOP} L ${WINDOW_HALF} ${WINDOW_TOP} A ${WINDOW_R} ${WINDOW_R} 0 0 1 ${-WINDOW_HALF} ${WINDOW_TOP} Z`}
          fill="#030405"
          stroke="rgba(255,255,255,0.08)"
        />
        <text y={73} textAnchor="middle" fontSize={27} fontWeight={400} fill="#f2f4f7">
          {Math.round(speed)}
        </text>
        <text y={86} textAnchor="middle" fontSize={8.5} fill="rgba(242,244,247,0.5)">
          km/h
        </text>
        <g transform="translate(41 62)">
          <rect x={-10} y={-11} width={20} height={22} rx={4} fill="none" stroke="rgba(255,255,255,0.25)" />
          <text textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill="#f2f4f7">
            {gear === "D" ? pdkGear : gear}
          </text>
        </g>
        {rpm === 0 && (
          <g transform="translate(-41 62)">
            <rect x={-9} y={-10} width={18} height={20} rx={3} fill="none" stroke="#4ca765" />
            <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill="#75d28b">
              A
            </text>
          </g>
        )}
        <g transform={`rotate(${rpmDeg(rpm)})`}>
          <polygon points="-2.6,0 -1.2,-128 1.2,-128 2.6,0 1.8,24 -1.8,24" fill="#f4f5f6" />
        </g>
        <circle r={13} fill="#1c1d21" stroke="#3b3d42" strokeWidth={1.5} />
        <circle r={4} fill="#0c0d0f" />
      </svg>
      <ShiftBar fill={fill} shift={shift} />
    </div>
  );
}

function ShiftBar({ fill, shift }: { fill: number; shift: boolean }) {
  return (
    <div className="relative h-[120px] w-[6px] overflow-hidden rounded-full bg-white/[0.08]">
      <motion.span
        className="absolute inset-x-0 bottom-0 rounded-full"
        style={{ height: `${(shift ? 1 : fill) * 100}%`, background: shift ? "#2f8fff" : "#ffd100" }}
        animate={{ opacity: shift ? [1, 0.15] : 1 }}
        transition={shift ? { duration: 0.12, repeat: Infinity, repeatType: "reverse" } : { duration: 0 }}
      />
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
      {/* floor glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(55%_45%_at_50%_70%,rgba(255,255,255,0.06),transparent_70%)]" />
      <Car3D />
      <motion.div
        initial={false}
        animate={{ opacity: driving ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        inert={driving}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute top-3.5 left-4 leading-tight">
          <div className="text-[13px] font-medium tracking-[0.02em] text-white/85">911 GT3 RS</div>
          <div className="text-[11px] text-white/35">992 · GT Silver Metallic</div>
        </div>
        <div className="absolute bottom-2 left-4 flex items-center gap-1.5 text-[11px] text-white/30">
          <Move3d size={13} strokeWidth={1.6} /> Drag to rotate · tap a part to open
        </div>
        <button
          onClick={() => set({ carViewReset: Date.now() })}
          aria-label="Reset view"
          className="pointer-events-auto absolute right-3 bottom-2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
        >
          <RotateCcw size={14} strokeWidth={1.8} />
        </button>
      </motion.div>
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
      <AnimatePresence initial={false}>
        {driving && (
          <motion.div
            key="cluster"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-none absolute inset-x-0 top-14 flex justify-center"
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
