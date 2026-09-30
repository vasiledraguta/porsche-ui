"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import { AnimatePresence, motion } from "motion/react";
import { Keyboard, Monitor, Volume2, VolumeX, X } from "lucide-react";
import { BottomBar } from "./BottomBar";
import { BesidePanel, CarPanel, DrivePill } from "./CarPanel";
import { DemoDrive, EtaBar, MapControls, Maneuver, SearchBox, SpeedLimit } from "./MapOverlays";
import { NavMap } from "./NavMap";
import { Rail } from "./Rail";
import { Sheets } from "./Sheets";
import { ACCENTS, AMBIENT, MODES, useCar } from "@/lib/store";

const W = 1920;
const H = 900;

export function Display() {
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [scale, setScale] = useState(0);
  const [notice, setNotice] = useState(true);
  const ambient = useCar((s) => AMBIENT[s.ambient]);
  const accent = useCar((s) => ACCENTS[s.accent].color);
  const ambientLevel = useCar((s) => s.ambientLevel);
  const covered = useCar((s) => s.sheet !== null);

  useEffect(() => {
    useCar.persist.rehydrate();
  }, []);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.min((width - 48) / (W + 28), (height - 48) / (H + 28)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} className="relative grid h-dvh w-full place-items-center overflow-hidden bg-[#050506]">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(60%_80%_at_50%_100%,var(--glow),transparent_70%)] transition-[--glow] duration-700"
        style={{ ["--glow" as string]: ambient, opacity: Math.round(ambientLevel / 7) / 100 }}
      />
      {scale > 0 && (
        <div
          className="absolute top-1/2 left-1/2"
          style={{ width: W + 28, height: H + 28, transform: `translate(-50%, -50%) scale(${scale})` }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative h-full w-full rounded-[2.25rem] bg-[#0a0a0b] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_3.25rem_7.5rem_-1.25rem_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
          <div
            className="relative flex h-full w-full overflow-hidden rounded-3xl bg-black"
            style={{ width: W, height: H, ["--ambient" as string]: ambient, ["--accent" as string]: accent }}
          >
            <Rail />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <main className="absolute inset-0 overflow-hidden">
                  <div inert={covered} className="contents">
                    <NavMap mapRef={mapRef} />
                    <BesidePanel>
                      <Maneuver />
                      <DrivePill />
                      <DemoDrive />
                      <SearchBox />
                      <SpeedLimit />
                      <MapControls mapRef={mapRef} />
                      <EtaBar />
                    </BesidePanel>
                  </div>
                  <BesidePanel>
                    <Sheets />
                    <ModePopup />
                    <VolumePopup />
                  </BesidePanel>
                </main>
                <CarPanel />
              </div>
              <BottomBar />
            </div>
            <div className="pointer-events-none absolute inset-0 z-50 rounded-3xl bg-[linear-gradient(115deg,rgba(255,255,255,0.035)_0%,transparent_30%)]" />
          </div>
          <div
            className="absolute -bottom-1 left-[8%] h-0.5 w-[84%] rounded-full transition-[background,box-shadow] duration-700"
            style={{
              background: ambient,
              opacity: 0.25 + ambientLevel / 140,
              boxShadow: `0 0 1.25rem 0.125rem ${ambient}`,
            }}
          />
          </motion.div>
        </div>
      )}
      {notice && (
        <div className="absolute inset-x-4 top-4 z-10 mx-auto hidden max-w-104 items-center gap-3.5 rounded-2xl bg-[#1a1d22]/95 py-3 pr-2 pl-4 shadow-[0_0.75rem_2rem_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md max-sm:flex portrait:flex">
          <Monitor size="1.25rem" strokeWidth={1.7} className="shrink-0 text-white/70" />
          <div className="min-w-0 flex-1">
            <div className="text-[1rem] font-medium text-white">Best on a desktop</div>
            <div className="text-[0.75rem] text-white/55">Open it on a larger screen, or turn your phone sideways.</div>
          </div>
          <button
            onClick={() => setNotice(false)}
            aria-label="Dismiss"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white active:press"
          >
            <X size="1.25rem" />
          </button>
        </div>
      )}
      <Shortcuts />
    </div>
  );
}

function ModePopup() {
  const at = useCar((s) => s.modePopupAt);
  const now = useCar((s) => s.now);
  const mode = useCar((s) => s.mode);
  const show = now - at < 1600 && now > 2000;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="mode"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] bg-[#1a1d22]/95 px-10 py-6 text-center shadow-[0_1.25rem_3.75rem_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl"
        >
          <div className="text-[0.75rem] font-medium tracking-[0.08em] text-white/40 uppercase">Driving mode</div>
          <div className="mt-1 text-[2rem] font-medium text-white">{MODES[mode].label}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VolumePopup() {
  const at = useCar((s) => s.volumePopupAt);
  const now = useCar((s) => s.now);
  const volume = useCar((s) => s.volume);
  const show = now - at < 1600;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="volume"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute bottom-24 left-1/2 z-40 flex w-84 -translate-x-1/2 items-center gap-4 rounded-[1.25rem] bg-[#1a1d22]/95 px-6 py-4 shadow-[0_1.25rem_3.75rem_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl"
        >
          {volume ? (
            <Volume2 size="1.5rem" strokeWidth={1.7} className="shrink-0 text-white" />
          ) : (
            <VolumeX size="1.5rem" strokeWidth={1.7} className="shrink-0 text-white/60" />
          )}
          <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/12">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-150"
              style={{ width: `${volume}%` }}
            />
          </span>
          <span className="w-9 text-right text-[1.25rem] font-medium text-white tabular-nums">{volume || "Off"}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SHORTCUTS: [string[], string][] = [
  [["W", "↑"], "Throttle, ends demo drive"],
  [["S", "↓"], "Brake"],
  [["A"], "Demo drive on or off, in D"],
  [["M"], "Next driving mode"],
  [["⇧ M"], "Previous driving mode"],
  [["Space"], "Play or pause"],
  [["←", "→"], "Previous or next track"],
  [["H"], "Home"],
  [["Esc"], "Close"],
  [["?"], "Keyboard shortcuts"],
];

function Shortcuts() {
  const open = useCar((s) => s.shortcuts);
  const set = useCar((s) => s.set);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        onClick={() => set({ shortcuts: true })}
        aria-label="Keyboard shortcuts"
        aria-haspopup="dialog"
        aria-keyshortcuts="?"
        title="Keyboard shortcuts (?)"
        className="absolute right-4 bottom-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-white/55 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:bg-white/[0.1] hover:text-white active:press pointer-coarse:hidden"
      >
        <Keyboard size="1.25rem" strokeWidth={1.7} />
      </button>
      <dialog
        ref={ref}
        aria-labelledby="shortcuts-title"
        onClose={() => set({ shortcuts: false })}
        onClick={(e) => {
          if (e.target === e.currentTarget) set({ shortcuts: false });
        }}
        className="m-auto w-120 max-w-[calc(100vw-2rem)] rounded-[1.25rem] bg-[#1a1d22]/95 p-0 text-white shadow-[0_1.25rem_3.75rem_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl translate-y-2.5 scale-96 opacity-0 transition-[opacity,scale,translate,overlay,display] transition-discrete duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] open:translate-y-0 open:scale-100 open:opacity-100 open:duration-300 starting:open:translate-y-2.5 starting:open:scale-96 starting:open:opacity-0 backdrop:bg-black/0 backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-200 open:backdrop:bg-black/55 open:backdrop:duration-300 starting:open:backdrop:bg-black/0"
      >
        <div className="relative px-7 pt-6 pb-7">
          <h2 id="shortcuts-title" className="text-[0.75rem] font-medium tracking-[0.08em] text-white/40 uppercase">
            Keyboard shortcuts
          </h2>
          <button
            onClick={() => set({ shortcuts: false })}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white active:press"
          >
            <X size="1.25rem" />
          </button>
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2.5">
            {SHORTCUTS.map(([keys, action]) => (
              <div key={action} className="contents">
                <dt className="flex gap-1.5">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="min-w-7 rounded-lg bg-white/[0.06] px-2 py-1 text-center font-sans text-[0.75rem] text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                    >
                      {k}
                    </kbd>
                  ))}
                </dt>
                <dd className="text-[1rem] text-white/70">{action}</dd>
              </div>
            ))}
          </dl>
        </div>
      </dialog>
    </>
  );
}
