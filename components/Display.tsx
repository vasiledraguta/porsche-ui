"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import { AnimatePresence, motion } from "motion/react";
import { Keyboard, X } from "lucide-react";
import { BottomBar } from "./BottomBar";
import { CarPanel } from "./CarPanel";
import { DemoDrive, EtaBar, MapControls, Maneuver, SearchBox, SpeedLimit } from "./MapOverlays";
import { NavMap } from "./NavMap";
import { Rail } from "./Rail";
import { Sheets } from "./Sheets";
import { AMBIENT, MODES, useCar } from "@/lib/store";

// Native design resolution of the display (wide PCM-style panel).
const W = 1920;
const H = 900;

/** One continuous screen, scaled to fit the browser like teslaui.com. */
export function Display() {
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [scale, setScale] = useState(0);
  const ambient = useCar((s) => AMBIENT[s.ambient]);
  const ambientLevel = useCar((s) => s.ambientLevel);

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
      {/* ambient light spill from the dash strip */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] transition-[background] duration-700"
        style={{
          background: `radial-gradient(60% 80% at 50% 100%, color-mix(in oklab, ${ambient} ${Math.round(ambientLevel / 7)}%, transparent), transparent 70%)`,
        }}
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
            className="relative h-full w-full rounded-[34px] bg-[#0a0a0b] p-[14px] shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_50px_120px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
          {/* screen */}
          <div
            className="relative flex h-full w-full overflow-hidden rounded-[22px] bg-black"
            style={{ width: W, height: H, ["--ambient" as string]: ambient }}
          >
            <Rail />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1">
                <CarPanel />
                <main className="relative min-w-0 flex-1 overflow-hidden">
                  <NavMap mapRef={mapRef} />
                  <Maneuver />
                  <DemoDrive />
                  <SearchBox />
                  <SpeedLimit />
                  <MapControls mapRef={mapRef} />
                  <EtaBar />
                  <Sheets />
                  <ModePopup />
                </main>
              </div>
              <BottomBar />
            </div>
            {/* glass */}
            <div className="pointer-events-none absolute inset-0 z-50 rounded-[22px] bg-[linear-gradient(115deg,rgba(255,255,255,0.035)_0%,transparent_30%)]" />
          </div>
          {/* ambient light strip under the display */}
          <div
            className="absolute -bottom-[3px] left-[8%] h-[2px] w-[84%] rounded-full transition-[background,box-shadow] duration-700"
            style={{
              background: ambient,
              opacity: 0.25 + ambientLevel / 140,
              boxShadow: `0 0 18px 2px ${ambient}`,
            }}
          />
          </motion.div>
        </div>
      )}
      <Shortcuts />
    </div>
  );
}

/** Drive-mode pop-up, like turning the steering-wheel mode switch. */
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
          className="absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-[#1a1d22]/95 px-10 py-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl"
        >
          <div className="text-[12px] tracking-[0.12em] text-white/45 uppercase">Driving mode</div>
          <div className="mt-1 text-[30px] font-medium text-white">{MODES[mode].label}</div>
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
  [["1", "2", "3", "4"], "Wet, Normal, Sport, Track"],
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
        className="absolute right-4 bottom-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-white/55 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-md transition hover:bg-white/[0.1] hover:text-white pointer-coarse:hidden"
      >
        <Keyboard size={18} strokeWidth={1.7} />
      </button>
      <dialog
        ref={ref}
        aria-labelledby="shortcuts-title"
        onClose={() => set({ shortcuts: false })}
        onClick={(e) => {
          if (e.target === e.currentTarget) set({ shortcuts: false });
        }}
        className="m-auto w-[480px] max-w-[calc(100vw-32px)] rounded-[18px] bg-[#1a1d22]/95 p-0 text-white shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl backdrop:bg-black/55"
      >
        <div className="relative px-7 pt-6 pb-7">
          <h2 id="shortcuts-title" className="text-[12px] tracking-[0.12em] text-white/45 uppercase">
            Keyboard shortcuts
          </h2>
          <button
            onClick={() => set({ shortcuts: false })}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
          <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2.5">
            {SHORTCUTS.map(([keys, action]) => (
              <div key={action} className="contents">
                <dt className="flex gap-1.5">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="min-w-[28px] rounded-[6px] bg-white/[0.06] px-2 py-1 text-center font-sans text-[13px] text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                    >
                      {k}
                    </kbd>
                  ))}
                </dt>
                <dd className="text-[14px] text-white/70">{action}</dd>
              </div>
            ))}
          </dl>
        </div>
      </dialog>
    </>
  );
}
