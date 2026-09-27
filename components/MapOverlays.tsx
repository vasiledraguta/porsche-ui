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
    <div className="absolute top-4 left-4 z-10 w-[330px] overflow-hidden rounded-[14px] bg-[#1a1d22]/95 shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-4 p-4"
        >
          <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-[12px] bg-[#2f8fff]">
            <Icon size={32} strokeWidth={2.4} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[28px] leading-none font-medium tracking-tight text-white tabular-nums">
              {fmtDist(dist)}
            </div>
            <div className="mt-1.5 truncate text-[15px] text-white/70">{name}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function SearchBox() {
  return (
    <div className="absolute top-4 right-4 z-10 w-[300px] overflow-hidden rounded-[14px] bg-[#1a1d22]/90 shadow-[0_10px_30px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md">
      <div className="flex cursor-default items-center gap-3 px-4 py-3.5 text-white/30 select-none">
        <Search size={18} strokeWidth={1.8} />
        <span className="text-[15px]">Search destination</span>
      </div>
      <div className="grid grid-cols-2 border-t border-white/[0.06] text-[14px] text-white/30">
        <button disabled className="flex cursor-default items-center justify-center gap-2 py-2.5">
          <House size={15} strokeWidth={1.8} /> Home
        </button>
        <button disabled className="flex cursor-default items-center justify-center gap-2 border-l border-white/[0.06] py-2.5">
          <Briefcase size={15} strokeWidth={1.8} /> Work
        </button>
      </div>
    </div>
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
    <div className="absolute right-4 bottom-4 left-4 z-10 flex items-center gap-6 rounded-[14px] bg-[#1a1d22]/95 px-5 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md">
      <div className="flex items-baseline gap-2">
        <span className="text-[24px] leading-none font-medium text-white tabular-nums">
          {eta ? `${String(eta.getHours()).padStart(2, "0")}:${String(eta.getMinutes()).padStart(2, "0")}` : "--:--"}
        </span>
        <span className="text-[13px] text-white/45">arrival</span>
      </div>
      <Sep />
      <Stat v={`${mins} min`} />
      <Sep />
      <Stat v={fmtDist(left)} />
      <Sep />
      <div className="flex items-center gap-1.5 text-[15px] text-white/80 tabular-nums">
        <Fuel size={15} className="text-white/60" strokeWidth={1.8} />
        {arriveFuel}% <span className="text-white/40">· {rangeFor(arriveFuel, mode)} km</span>
      </div>
      <div className="ml-auto min-w-0 text-right">
        <div className="truncate text-[14px] text-white">{ROUTE.to}</div>
        <div className="truncate text-[12px] text-white/45">{ROUTE.toSub}</div>
      </div>
    </div>
  );
}

function Stat({ v }: { v: string }) {
  return <span className="text-[15px] text-white/80 tabular-nums">{v}</span>;
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
    else if (dir === 1) mapRef.current?.zoomIn({ duration: 0 });
    else mapRef.current?.zoomOut({ duration: 0 });
  };
  return (
    <div className="absolute right-4 bottom-[92px] z-10 flex flex-col gap-2">
      <AnimatePresence>
        {!follow && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => set({ follow: true })}
            className="flex h-11 items-center gap-2 rounded-[12px] bg-[#2f8fff] px-3.5 text-[13px] font-medium text-white shadow-lg"
          >
            <Crosshair size={16} /> Re-centre
          </motion.button>
        )}
      </AnimatePresence>
      <CtlBtn label={map3d ? "2D" : "3D"} onClick={() => set({ map3d: !map3d })}>
        <Box size={17} strokeWidth={1.7} />
      </CtlBtn>
      <CtlBtn label="Zoom in" onClick={() => zoom(1)}>
        <Plus size={17} strokeWidth={1.8} />
      </CtlBtn>
      <CtlBtn label="Zoom out" onClick={() => zoom(-1)}>
        <Minus size={17} strokeWidth={1.8} />
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
      className="ml-auto grid h-11 w-11 place-items-center rounded-[12px] bg-[#1a1d22]/90 text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:text-white"
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
      className={`absolute bottom-[92px] left-4 z-10 grid h-[54px] w-[54px] place-items-center rounded-full border-[5px] border-[#e5332a] bg-white shadow-lg ${
        speeding ? "animate-[limit-flash_0.6s_ease-in-out_3]" : ""
      }`}
    >
      <span className="text-[19px] font-semibold text-black tabular-nums">{speedLimitAt(d)}</span>
    </div>
  );
}
