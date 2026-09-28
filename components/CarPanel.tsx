"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { Fuel, Lock, LockOpen, Move3d, RotateCcw } from "lucide-react";
import { MiniPlayer } from "./MiniPlayer";
import { useSlider } from "./ui/useSlider";

// WebGL only runs client-side.
const Car3D = dynamic(() => import("./Car3D"), { ssr: false });
import { DRIVE_LAYOUTS, MODES, MODE_ORDER, REDLINE, rangeFor, useCar, type DriveLayout } from "@/lib/store";

const STRIP_W = 176;
const EASE = [0.2, 0.8, 0.2, 1] as const;
const LAYOUT_LABEL: Record<DriveLayout, string> = { strip: "Strip", bar: "Bar", pill: "Pill" };

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

/** Left vehicle column: speed, PDK gear, rev bar, fuel, the 3D 911 GT3 RS, lock/view controls, drive mode, media. */
export function CarPanel() {
  const driving = useCar((s) => s.gear !== "P");
  const strip = useCar((s) => s.driveLayout === "strip");
  const ref = useGearFocus<HTMLElement>(!driving);
  return (
    <motion.section
      ref={ref}
      initial={false}
      animate={{ width: driving ? (strip ? STRIP_W : 0) : 540 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="relative z-20 shrink-0 overflow-hidden bg-[#0e1013]"
    >
      <motion.div
        initial={false}
        animate={{ opacity: driving ? 0 : 1 }}
        transition={{ duration: 0.35 }}
        inert={driving}
        className="absolute inset-y-0 right-0 flex w-[540px] flex-col"
      >
        <DriveHeader />
        <CarStage />
        <ModeBar />
        <div className="px-5 pb-5">
          <MiniPlayer />
        </div>
      </motion.div>
      <AnimatePresence>{driving && strip && <DriveStrip />}</AnimatePresence>
    </motion.section>
  );
}

function DriveStrip() {
  const ref = useGearFocus<HTMLDivElement>(true, true);
  const rpm = useCar((s) => s.rpm);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.25, duration: 0.35 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      style={{ width: STRIP_W }}
      className="absolute inset-y-0 left-0 flex flex-col px-5 pt-6 pb-5"
    >
      <GearSelect />
      <Speed className="mt-3" size="text-[52px]" />
      <div className="mt-6 min-h-0 flex-1">
        <RevBar rpm={rpm} shift={rpm > 8300} vertical />
      </div>
      <FuelReadout className="mt-5" justify="justify-start" />
      <ModeBar vertical className="mt-5" />
    </motion.div>
  );
}

export function DrivePill() {
  const show = useCar((s) => s.gear !== "P" && s.driveLayout === "pill");
  return <AnimatePresence>{show && <PillBody />}</AnimatePresence>;
}

function PillBody() {
  const ref = useGearFocus<HTMLDivElement>(true, true);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.4, ease: EASE } }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
      className="absolute top-[122px] left-4 z-10 flex items-center gap-4 rounded-full bg-[#1a1d22]/95 py-3 pr-6 pl-5 shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md"
    >
      <GearSelect />
      <span className="h-6 w-px bg-white/10" />
      <Speed className="" size="text-[28px]" />
    </motion.div>
  );
}

export function DriveBarLead() {
  const show = useCar((s) => s.gear !== "P" && s.driveLayout === "bar");
  return <AnimatePresence>{show && <BarLeadBody />}</AnimatePresence>;
}

function BarLeadBody() {
  const ref = useGearFocus<HTMLDivElement>(true, true);
  const rpm = useCar((s) => s.rpm);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: "auto", transition: { delay: 0.2, duration: 0.45, ease: EASE } }}
      exit={{ opacity: 0, width: 0, transition: { duration: 0.25, ease: EASE } }}
      className="-mr-6 shrink-0 overflow-hidden"
    >
      <div className="flex w-max items-center gap-6 pr-6">
        <GearSelect />
        <span className="h-5 w-px bg-white/10" />
        <Speed className="" size="text-[26px]" />
        <RevBar rpm={rpm} shift={rpm > 8300} className="w-[150px]" />
        <span className="h-5 w-px bg-white/10" />
        <ModeBar compact className="" />
        <span className="h-5 w-px bg-white/10" />
      </div>
    </motion.div>
  );
}

export function LayoutSwitch() {
  const driving = useCar((s) => s.gear !== "P");
  const layout = useCar((s) => s.driveLayout);
  const set = useCar((s) => s.set);
  return (
    <AnimatePresence>
      {driving && (
        <motion.div
          role="group"
          aria-label="Driving layout"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="absolute top-[68px] left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-[#1a1d22]/90 p-1 text-[12.5px] shadow-[0_10px_30px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md"
        >
          {DRIVE_LAYOUTS.map((l) => (
            <button
              key={l}
              aria-pressed={layout === l}
              onClick={() => set({ driveLayout: l })}
              className={`rounded-full px-3.5 py-1.5 transition active:press ${layout === l ? "bg-white/[0.12] text-white" : "text-white/50 hover:text-white/80"}`}
            >
              {LAYOUT_LABEL[l]}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GearSelect() {
  const speed = useCar((s) => s.speed);
  const gear = useCar((s) => s.gear);
  const pdkGear = useCar((s) => s.pdkGear);
  const setGear = useCar((s) => s.setGear);
  return (
    <div className="flex gap-3 text-[15px] font-medium">
      {(["P", "N", "D"] as const).map((g) => (
        <button
          key={g}
          data-gear
          aria-pressed={g === gear}
          disabled={g === "P" && speed > 0}
          onClick={() => setGear(g)}
          className={`rounded-[6px] transition active:press ${g === gear ? "text-white" : "text-white/25 hover:text-white/50 disabled:cursor-not-allowed disabled:opacity-40"}`}
        >
          {g === "D" && gear === "D" ? `D${pdkGear}` : g}
        </button>
      ))}
    </div>
  );
}

function Speed({ className = "mt-2", size = "text-[64px]" }: { className?: string; size?: string }) {
  const speed = useCar((s) => s.speed);
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`${size} leading-[0.9] font-normal text-white tabular-nums`}>{Math.round(speed)}</span>
      <span className="text-[14px] text-white/45">km/h</span>
    </div>
  );
}

function FuelReadout({ className = "text-right", justify = "justify-end" }: { className?: string; justify?: string }) {
  const fuel = useCar((s) => s.fuel);
  const mode = useCar((s) => s.mode);
  return (
    <div className={className}>
      <div className={`flex items-center gap-2 ${justify}`}>
        <span className="text-[15px] font-medium text-white tabular-nums">{Math.round(fuel)}%</span>
        <FuelGauge pct={fuel} />
      </div>
      <div className="mt-1 text-[13px] text-white/45 tabular-nums">{rangeFor(fuel, mode)} km</div>
    </div>
  );
}

function DriveHeader() {
  const rpm = useCar((s) => s.rpm);
  const shift = rpm > 8300;

  return (
    <div className="flex items-start justify-between px-7 pt-6">
      <div>
        <GearSelect />
        <Speed />
        <div className="flex items-end gap-3">
          <RevBar rpm={rpm} shift={shift} />
          {rpm === 0 && <span role="status" aria-label="Auto start/stop active" className="mb-0.5 rounded border border-[#4ca765] px-1.5 py-0.5 text-[11px] font-semibold text-[#75d28b]">A</span>}
        </div>
      </div>
      <FuelReadout />
    </div>
  );
}

/** Rev counter strip, 0–9,000 rpm. The last 1,000 rpm is the red zone; it flashes at the shift point. */
function RevBar({ rpm, shift, vertical = false, className = "mt-3 w-[190px]" }: { rpm: number; shift: boolean; vertical?: boolean; className?: string }) {
  const pct = Math.min(1, rpm / REDLINE);
  const fill = shift ? "#ff3b30" : pct > 0.78 ? "#ffb020" : "#fff";
  const label = <span className={shift ? "text-[#ff6b61]" : "text-white/60"}>{(Math.round(rpm / 50) * 50).toLocaleString("en")} rpm</span>;
  if (vertical) {
    return (
      <div className="flex h-full gap-3">
        <div className="relative w-[4px] rounded-full bg-white/10">
          <span className="absolute inset-x-0 top-0 h-[11.1%] rounded-t-full bg-[#ff3b30]/35" />
          <span className="absolute inset-x-0 bottom-0 rounded-full" style={{ height: `${pct * 100}%`, background: fill }} />
        </div>
        <div className="flex flex-col justify-between text-[11px] text-white/35 tabular-nums">
          <span>9</span>
          {label}
        </div>
      </div>
    );
  }
  return (
    <div className={className}>
      <div className="relative h-[4px] rounded-full bg-white/10">
        <span className="absolute inset-y-0 right-0 w-[11.1%] rounded-r-full bg-[#ff3b30]/35" />
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct * 100}%`, background: fill }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-white/35 tabular-nums">
        {label}
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

function ModeBar({ className = "px-5 pb-3", vertical = false, compact = false }: { className?: string; vertical?: boolean; compact?: boolean }) {
  const mode = useCar((s) => s.mode);
  const setMode = useCar((s) => s.setMode);
  const { container, indicator } = useSlider(MODE_ORDER.indexOf(mode));
  const size = vertical ? "px-3 py-[9px] text-left text-[13.5px]" : compact ? "px-3 py-[6px] text-[13px]" : "flex-1 py-[9px] text-[13.5px]";
  return (
    <div className={className}>
      <div ref={container} className={`relative flex rounded-[12px] bg-white/[0.05] p-[3px] ${vertical ? "flex-col" : ""}`}>
        <span
          ref={indicator}
          className="pointer-events-none absolute top-0 left-0 rounded-[9px] bg-[#262a30] opacity-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_2px_8px_rgba(0,0,0,0.4)]"
        />
        {MODE_ORDER.map((m) => (
          <button key={m} data-slot aria-pressed={mode === m} onClick={() => setMode(m)} className={`relative rounded-[9px] transition active:press ${size}`}>
            <span className={`relative ${mode === m ? "text-white" : "text-white/50"}`}>{MODES[m].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
