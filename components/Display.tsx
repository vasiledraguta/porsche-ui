"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import { AnimatePresence, motion } from "motion/react";
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
            style={{ width: W, height: H }}
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
