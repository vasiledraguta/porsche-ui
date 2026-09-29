"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { Fuel, Lock, LockOpen, Move3d, RotateCcw } from "lucide-react";
import { MiniPlayer } from "./MiniPlayer";
import { useSlider } from "./ui/useSlider";

const Car3D = dynamic(() => import("./Car3D"), { ssr: false });
import { MODES, MODE_ORDER, REDLINE, rangeFor, useCar } from "@/lib/store";

export const PANEL_W = 540;
export const PANEL_S = 0.6;
export const PANEL_EASE = [0.2, 0.8, 0.2, 1] as const;

function useGearFocus<T extends HTMLElement>(active: boolean, onMount = false) {
  const ref = useRef<T>(null);
  const was = useRef(onMount ? !active : active);
  useEffect(() => {
    const changed = was.current !== active;
    was.current = active;
    if (!active || !changed) return;
    const a = document.activeElement;
    if (a && a !== document.body && !a.closest("[inert]") && !a.closest("[data-gear]")) return;
    ref.current?.querySelector<HTMLElement>('[data-gear][aria-pressed="true"]')?.focus();
  }, [active]);
  return ref;
}

export function CarPanel() {
  const driving = useCar((s) => s.gear !== "P");
  const ref = useGearFocus<HTMLElement>(!driving);
  return (
    <motion.section
      ref={ref}
      initial={false}
      animate={{ x: driving ? -PANEL_W : 0 }}
      transition={{ duration: PANEL_S, ease: PANEL_EASE }}
      inert={driving}
      style={{ width: PANEL_W }}
      className="absolute inset-y-0 left-0 z-20 flex flex-col bg-[#0e1013]"
    >
      <DriveHeader />
      <CarStage />
      <ModeBar />
      <div className="px-5 pb-5">
        <MiniPlayer />
      </div>
    </motion.section>
  );
}

export function BesidePanel({ children }: { children: React.ReactNode }) {
  const driving = useCar((s) => s.gear !== "P");
  return (
    <motion.div
      initial={false}
      animate={{ left: driving ? 0 : PANEL_W }}
      transition={{ duration: PANEL_S, ease: PANEL_EASE }}
      className="pointer-events-none absolute inset-y-0 right-0 *:pointer-events-auto"
    >
      {children}
    </motion.div>
  );
}

export function DrivePill() {
  const driving = useCar((s) => s.gear !== "P");
  return <AnimatePresence>{driving && <PillBody />}</AnimatePresence>;
}

function PillBody() {
  const ref = useGearFocus<HTMLDivElement>(true, true);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: PANEL_S * 0.5, duration: 0.35, ease: PANEL_EASE } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
      className="absolute top-[7.625rem] left-4 z-10 flex items-center gap-4 rounded-full bg-[#1a1d22]/95 py-3 pr-6 pl-5 shadow-[0_0.625rem_1.875rem_rgba(0,0,0,0.45),inset_0_0_0_0.0625rem_rgba(255,255,255,0.06)] backdrop-blur-md"
    >
      <GearSelect />
      <span className="h-6 w-[0.0625rem] bg-white/10" />
      <Speed className="" size="text-[1.75rem]" />
    </motion.div>
  );
}

function GearSelect() {
  const speed = useCar((s) => s.speed);
  const gear = useCar((s) => s.gear);
  const pdkGear = useCar((s) => s.pdkGear);
  const setGear = useCar((s) => s.setGear);
  return (
    <div className="flex gap-3 text-[0.9375rem] font-medium">
      {(["P", "N", "D"] as const).map((g) => (
        <button
          key={g}
          data-gear
          aria-pressed={g === gear}
          disabled={g === "P" && speed > 0}
          onClick={() => setGear(g)}
          className={`rounded-[0.375rem] transition ${g === gear ? "text-white" : "text-white/25 hover:text-white/50 disabled:cursor-not-allowed disabled:opacity-40"}`}
        >
          {g === "D" && gear === "D" ? `D${pdkGear}` : g}
        </button>
      ))}
    </div>
  );
}

function Speed({ className = "mt-2", size = "text-[4rem]" }: { className?: string; size?: string }) {
  const speed = useCar((s) => s.speed);
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`${size} leading-[0.9] font-normal text-white tabular-nums`}>{Math.round(speed)}</span>
      <span className="text-[0.875rem] text-white/45">km/h</span>
    </div>
  );
}

function DriveHeader() {
  const rpm = useCar((s) => s.rpm);
  const fuel = useCar((s) => s.fuel);
  const mode = useCar((s) => s.mode);
  const shift = rpm > 8300;

  return (
    <div className="flex items-start justify-between px-7 pt-6">
      <div>
        <GearSelect />
        <Speed />
        <div className="flex items-end gap-3">
          <RevBar rpm={rpm} shift={shift} />
          {rpm === 0 && <span role="status" aria-label="Auto start/stop active" className="mb-0.5 rounded border border-[#4ca765] px-1.5 py-0.5 text-[0.6875rem] font-semibold text-[#75d28b]">A</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-[0.9375rem] font-medium text-white tabular-nums">{Math.round(fuel)}%</span>
          <FuelGauge pct={fuel} />
        </div>
        <div className="mt-1 text-[0.8125rem] text-white/45 tabular-nums">{rangeFor(fuel, mode)} km</div>
      </div>
    </div>
  );
}

function RevBar({ rpm, shift }: { rpm: number; shift: boolean }) {
  const pct = Math.min(1, rpm / REDLINE);
  return (
    <div className="mt-3 w-[11.875rem]">
      <div className="relative h-[0.25rem] rounded-full bg-white/10">
        <span className="absolute inset-y-0 right-0 w-[11.1%] rounded-r-full bg-[#ff3b30]/35" />
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct * 100}%`, background: shift ? "#ff3b30" : pct > 0.78 ? "#ffb020" : "#fff" }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[0.6875rem] text-white/35 tabular-nums">
        <span className={shift ? "text-[#ff6b61]" : "text-white/60"}>{(Math.round(rpm / 50) * 50).toLocaleString("en")} rpm</span>
        <span>9</span>
      </div>
    </div>
  );
}

function FuelGauge({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <Fuel size="0.875rem" strokeWidth={1.8} className={pct < 12 ? "text-[#ffb020]" : "text-white/55"} />
      <span className="relative h-[0.3125rem] w-[1.875rem] overflow-hidden rounded-full bg-white/12">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: pct < 12 ? "#ffb020" : "#f2f4f7" }}
        />
      </span>
    </span>
  );
}

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
    <div className="relative mx-2 mt-1 flex-1 overflow-hidden rounded-[1.125rem]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(55%_45%_at_50%_70%,rgba(255,255,255,0.06),transparent_70%)]" />
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
              className="h-[9.375rem] w-[7.3125rem] animate-[shimmer_2.4s_linear_infinite] bg-[linear-gradient(100deg,rgba(255,255,255,0.4)_35%,rgba(255,255,255,0.95)_50%,rgba(255,255,255,0.4)_65%)] bg-[length:200%_100%] [mask:url(/brand/porsche-crest.svg)_center/contain_no-repeat]"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute top-3.5 left-4 leading-tight">
        <div className="text-[0.8125rem] font-medium tracking-[0.02em] text-white/85">911 GT3 RS</div>
      </div>
      <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <button
          onClick={toggleLock}
          aria-label={locked ? "Unlock" : "Lock"}
          className="flex items-center gap-2 rounded-full bg-black/40 py-[0.4375rem] pr-3.5 pl-3 text-[0.78125rem] backdrop-blur-sm transition hover:bg-black/60 active:press"
        >
          {locked ? (
            <Lock size="0.9375rem" strokeWidth={1.9} className="text-white" />
          ) : (
            <LockOpen size="0.9375rem" strokeWidth={1.9} className="text-(--ambient) transition-colors" />
          )}
          <span className={`transition-colors ${locked ? "text-white" : "text-(--ambient)"}`}>{locked ? "Locked" : anyOpen ? "Open" : "Unlocked"}</span>
        </button>
        <button
          onClick={() => set({ drs: !drs })}
          aria-pressed={drs}
          className="rounded-full bg-black/40 px-3.5 py-[0.4375rem] text-[0.78125rem] font-medium tracking-[0.06em] backdrop-blur-sm transition hover:bg-black/60 active:press"
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
        <div className="absolute bottom-2 left-4 flex items-center gap-1.5 text-[0.6875rem] text-white/30">
          <Move3d size="0.8125rem" strokeWidth={1.6} /> Drag to rotate · tap a part to open
        </div>
        <button
          onClick={() => set({ carViewReset: Date.now() })}
          aria-label="Reset view"
          className="pointer-events-auto absolute right-3 bottom-2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/60 backdrop-blur-sm transition hover:bg-black/60 hover:text-white active:press"
        >
          <RotateCcw size="0.875rem" strokeWidth={1.8} />
        </button>
      </motion.div>
      <AnimatePresence>
        {lift && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 right-4 rounded-full bg-(--ambient)/15 px-3 py-1 text-[0.75rem] text-(--ambient)"
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
      <div ref={container} className="relative flex rounded-[0.75rem] bg-white/[0.05] p-[0.1875rem]">
        <span
          ref={indicator}
          className="pointer-events-none absolute top-0 left-0 rounded-[0.5625rem] bg-[#262a30] opacity-0 shadow-[inset_0_0_0_0.0625rem_rgba(255,255,255,0.07),0_0.125rem_0.5rem_rgba(0,0,0,0.4)]"
        />
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            data-slot
            aria-pressed={mode === m}
            onClick={() => mode !== m && setMode(m)}
            className={`relative flex-1 rounded-[0.5625rem] py-[0.5625rem] text-[0.84375rem] transition ${mode === m ? "cursor-default" : ""}`}
          >
            <span className={`relative ${mode === m ? "text-white" : "text-white/50"}`}>{MODES[m].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
