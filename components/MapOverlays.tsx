"use client";

import type { RefObject } from "react";
import type { Map } from "maplibre-gl";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Box,
  Briefcase,
  Crosshair,
  Flag,
  House,
  Minus,
  Plus,
  RotateCw,
  Search,
  Fuel,
  CornerUpLeft,
  CornerUpRight,
} from "lucide-react";
import { ROUTE, ROUTE_LEN, fmtDist, isSpeeding, nextStep, speedLimitAt } from "@/lib/route";
import { fuelPercentForDistance, rangeFor, useCar } from "@/lib/store";
import { useClock } from "@/lib/useClock";

export function Maneuver() {
  const d = useCar((s) => s.routeD);
  const { step, dist } = nextStep(d);
  const Icon = !step
    ? Flag
    : step.type === "rotary" || step.type === "roundabout"
      ? RotateCw
      : step.mod === "left"
        ? CornerUpLeft
        : step.mod === "right"
          ? CornerUpRight
          : step.mod === "slight left"
            ? ArrowUpLeft
            : step.mod === "slight right"
              ? ArrowUpRight
              : ArrowUp;
  const name = step ? step.name || "Unnamed road" : ROUTE.to;
  const key = step ? `${step.at}` : "arrive";

  return (
    <div className="absolute top-4 left-4 z-10 w-84 overflow-hidden rounded-2xl bg-[#1a1d22]/95 shadow-[0_0.75rem_2rem_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-4 p-4"
        >
          <div className="grid h-15 w-15 shrink-0 place-items-center rounded-xl bg-[#3584d6]">
            <Icon size="2rem" strokeWidth={2.4} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[1.75rem] leading-none font-medium tracking-tight text-white tabular-nums">
              {fmtDist(dist)}
            </div>
            <div className="mt-1.5 truncate text-[1rem] text-white/70">{name}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function SearchBox() {
  return (
    <div className="absolute top-4 right-4 z-10 w-76 overflow-hidden rounded-2xl bg-[#1a1d22]/95 shadow-[0_0.75rem_2rem_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md">
      <div className="flex cursor-default items-center gap-3 px-4 py-3.5 text-white/30 select-none">
        <Search size="1.25rem" strokeWidth={1.8} />
        <span className="text-[1rem]">Search destination</span>
      </div>
      <div className="grid grid-cols-2 border-t border-white/[0.06] text-[1rem] text-white/30">
        <button disabled className="flex cursor-default items-center justify-center gap-2 py-2.5">
          <House size="1rem" strokeWidth={1.8} /> Home
        </button>
        <button disabled className="flex cursor-default items-center justify-center gap-2 border-l border-white/[0.06] py-2.5">
          <Briefcase size="1rem" strokeWidth={1.8} /> Work
        </button>
      </div>
    </div>
  );
}

export function DemoDrive() {
  const autopilot = useCar((s) => s.autopilot);
  const set = useCar((s) => s.set);
  return (
    <button
      onClick={() => set({ autopilot: !autopilot })}
      aria-pressed={autopilot}
      aria-keyshortcuts="A"
      className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-[#1a1d22]/90 px-4 py-2.5 text-[0.75rem] shadow-[0_0.75rem_2rem_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:bg-[#22262b]/95 active:press"
    >
      <span
        className={`h-2 w-2 rounded-full ${autopilot ? "animate-[breathe_1.6s_ease-in-out_infinite] bg-(--accent)" : "bg-white/30"}`}
      />
      <span className="text-white/85">Demo drive</span>
      <span aria-hidden className={`font-medium ${autopilot ? "text-white" : "text-white/55"}`}>
        {autopilot ? "On" : "Off"}
      </span>
    </button>
  );
}

export function EtaBar() {
  const d = useCar((s) => s.routeD);
  const fuel = useCar((s) => s.fuel);
  const mode = useCar((s) => s.mode);
  const now = useClock();
  const left = ROUTE_LEN - d;
  const mins = Math.max(1, Math.round((left / ROUTE_LEN) * (ROUTE.duration / 60) + 1));
  const eta = now ? new Date(now.getTime() + mins * 60000) : null;
  const arriveFuel = Math.max(0, Math.round(fuel - fuelPercentForDistance(left / 1000, mode)));
  return (
    <div className="absolute right-4 bottom-4 left-4 z-10 flex items-center gap-6 rounded-2xl bg-[#1a1d22]/95 px-5 py-3.5 shadow-[0_0.75rem_2rem_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md">
      <div className="flex items-baseline gap-2">
        <span className="text-[1.5rem] leading-none font-medium text-white tabular-nums">
          {eta ? `${String(eta.getHours()).padStart(2, "0")}:${String(eta.getMinutes()).padStart(2, "0")}` : "--:--"}
        </span>
        <span className="text-[0.75rem] text-white/55">arrival</span>
      </div>
      <Sep />
      <Stat v={`${mins} min`} />
      <Sep />
      <Stat v={fmtDist(left)} />
      <Sep />
      <div className="flex items-center gap-1.5 text-[1rem] text-white/80 tabular-nums">
        <Fuel size="1rem" className="text-white/60" strokeWidth={1.8} />
        {arriveFuel}% <span className="text-white/50">· {rangeFor(arriveFuel, mode)} km</span>
      </div>
      <div className="ml-auto min-w-0 text-right">
        <div className="truncate text-[1rem] text-white">{ROUTE.to}</div>
        <div className="truncate text-[0.75rem] text-white/55">{ROUTE.toSub}</div>
      </div>
    </div>
  );
}

function Stat({ v }: { v: string }) {
  return <span className="text-[1rem] text-white/80 tabular-nums">{v}</span>;
}
function Sep() {
  return <span className="h-5 w-px bg-white/10" />;
}

export function MapControls({ mapRef }: { mapRef: RefObject<Map | null> }) {
  const map3d = useCar((s) => s.map3d);
  const follow = useCar((s) => s.follow);
  const set = useCar((s) => s.set);
  const zoomBias = useCar((s) => s.zoomBias);
  const zoom = (dir: 1 | -1) => {
    if (follow) set({ zoomBias: Math.max(-3, Math.min(2, zoomBias + dir * 0.7)) });
    else if (mapRef.current) mapRef.current.easeTo({ zoom: mapRef.current.getZoom() + dir, duration: 300 });
  };
  return (
    <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-2">
      <AnimatePresence>
        {!follow && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => set({ follow: true })}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#1a1d22]/95 px-3.5 text-[0.75rem] font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition active:press"
          >
            <Crosshair size="1rem" /> Re-centre
          </motion.button>
        )}
      </AnimatePresence>
      <CtlBtn label={map3d ? "2D" : "3D"} onClick={() => set({ map3d: !map3d })}>
        <Box size="1rem" strokeWidth={1.7} />
      </CtlBtn>
      <CtlBtn label="Zoom in" onClick={() => zoom(1)}>
        <Plus size="1rem" strokeWidth={1.8} />
      </CtlBtn>
      <CtlBtn label="Zoom out" onClick={() => zoom(-1)}>
        <Minus size="1rem" strokeWidth={1.8} />
      </CtlBtn>
    </div>
  );
}

function CtlBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="ml-auto grid h-11 w-11 place-items-center rounded-xl bg-[#1a1d22]/95 text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:text-white active:press"
    >
      {children}
    </button>
  );
}

export function SpeedLimit() {
  const d = useCar((s) => s.routeD);
  const signs = useCar((s) => s.signs);
  const speeding = useCar((s) => isSpeeding(s.speed, s.routeD));
  if (!signs) return null;
  return (
    <div
      className={`absolute bottom-24 left-4 z-10 grid h-14 w-14 place-items-center rounded-full border-[0.25rem] border-[#e5332a] bg-white shadow-lg ${
        speeding ? "animate-[limit-flash_0.6s_ease-in-out_3]" : ""
      }`}
    >
      <span className="text-[1.25rem] font-semibold text-black tabular-nums">{speedLimitAt(d)}</span>
    </div>
  );
}
