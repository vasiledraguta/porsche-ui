"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
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
  const setGear = useCar((s) => s.setGear);
  const shift = rpm > 8300;

  return (
    <div className="flex items-start justify-between px-7 pt-6">
      <div>
        <div className="flex gap-3 text-[15px] font-medium">
          {(["P", "N", "D"] as const).map((g) => (
            <button
              key={g}
              disabled={g === "P" && speed > 0}
              onClick={() => setGear(g)}
              className={`rounded-[6px] transition active:press ${g === gear ? "text-white" : "text-white/25 hover:text-white/50 disabled:cursor-not-allowed disabled:opacity-40"}`}
            >
              {g === "D" && gear === "D" ? `D${pdkGear}` : g}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[64px] leading-[0.9] font-normal text-white tabular-nums">
            {Math.round(speed)}
          </span>
          <span className="text-[14px] text-white/45">km/h</span>
        </div>
        <div className="flex items-end gap-3">
          <RevBar rpm={rpm} shift={shift} />
          {rpm === 0 && <span role="status" aria-label="Auto start/stop active" className="mb-0.5 rounded border border-[#4ca765] px-1.5 py-0.5 text-[11px] font-semibold text-[#75d28b]">A</span>}
        </div>
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

/** Rev counter strip, 0–9,000 rpm. The last 1,000 rpm is the red zone; it flashes at the shift point. */
function RevBar({ rpm, shift }: { rpm: number; shift: boolean }) {
  const pct = Math.min(1, rpm / REDLINE);
  return (
    <div className="mt-3 w-[190px]">
      <div className="relative h-[4px] rounded-full bg-white/10">
        <span className="absolute inset-y-0 right-0 w-[11.1%] rounded-r-full bg-[#ff3b30]/35" />
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct * 100}%`, background: shift ? "#ff3b30" : pct > 0.78 ? "#ffb020" : "#fff" }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-white/35 tabular-nums">
        <span className={shift ? "text-[#ff6b61]" : "text-white/60"}>{(Math.round(rpm / 50) * 50).toLocaleString("en")} rpm</span>
        <span>9</span>
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
  const [ready, setReady] = useState(false);
  const [shimmered, setShimmered] = useState(false);
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative mx-2 mt-1 flex-1 overflow-hidden rounded-[18px]">
      {/* floor glow */}
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(55%_45%_at_50%_70%,rgba(255,255,255,0.06),transparent_70%)] transition-opacity duration-1000 ${driving ? "opacity-0" : ""}`} />
      <Car3D onReady={() => setReady(true)} revealed={revealed} />
      <AnimatePresence onExitComplete={() => setRevealed(true)}>
        {!(ready && shimmered) && (
          <motion.div
            role="status"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="pointer-events-none absolute inset-0 grid place-items-center bg-[#0e1013]"
          >
            <span className="sr-only">Loading the 3D car</span>
            <span
              aria-hidden
              onAnimationIteration={() => setShimmered(true)}
              className="h-[150px] w-[117px] animate-[shimmer_2.4s_linear_infinite] bg-[linear-gradient(100deg,rgba(255,255,255,0.4)_35%,rgba(255,255,255,0.95)_50%,rgba(255,255,255,0.4)_65%)] bg-[length:200%_100%] [mask:url(/brand/porsche-crest.svg)_center/contain_no-repeat]"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute top-3.5 left-4 leading-tight">
        <div className="text-[13px] font-medium tracking-[0.02em] text-white/85">911 GT3 RS</div>
      </div>
      <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button
          onClick={toggleLock}
          aria-label={locked ? "Unlock" : "Lock"}
          className="flex items-center gap-2 rounded-full bg-black/40 py-[7px] pr-3.5 pl-3 text-[12.5px] backdrop-blur-sm transition hover:bg-black/60 active:press"
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
          className="rounded-full bg-black/40 px-3.5 py-[7px] text-[12.5px] font-medium tracking-[0.06em] backdrop-blur-sm transition hover:bg-black/60 active:press"
        >
          <span className={`transition-colors ${drs ? "text-(--ambient)" : "text-white"}`}>DRS</span>
        </button>
      </div>
      <motion.div
        initial={false}
        animate={{ opacity: driving ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        inert={driving}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
      >
        <div className="absolute bottom-2 left-4 flex items-center gap-1.5 text-[11px] text-white/30">
          <Move3d size={13} strokeWidth={1.6} /> Drag to rotate · tap a part to open
        </div>
        <button
          onClick={() => set({ carViewReset: Date.now() })}
          aria-label="Reset view"
          className="pointer-events-auto absolute right-3 bottom-2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm transition hover:bg-black/60 hover:text-white active:press"
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
          <button key={m} data-slot aria-pressed={mode === m} onClick={() => setMode(m)} className="relative flex-1 rounded-[9px] py-[9px] text-[13.5px] transition active:press">
            <span className={`relative ${mode === m ? "text-white" : "text-white/50"}`}>{MODES[m].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
