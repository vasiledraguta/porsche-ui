"use client";

import { useEffect, useState } from "react";
import { Gamepad2, X } from "lucide-react";
import { PaintSwatches } from "./Sheets";
import { MODES, MODE_ORDER, useCar, type DriveMode } from "@/lib/store";

/** Runs the vehicle sim and wires keyboard shortcuts. */
export function Ticker() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      useCar.getState().tick(dt, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const s = useCar.getState();
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") s.set({ throttle: 1, autopilot: false });
      else if (k === "arrowdown" || k === "s") s.set({ brake: 1 });
      else if (e.repeat) return;
      else if (k === "m") s.cycleMode(e.shiftKey ? -1 : 1);
      else if (["1", "2", "3", "4"].includes(k)) s.setMode(MODE_ORDER[Number(k) - 1]);
      else if (k === " ") {
        e.preventDefault();
        s.set({ playing: !s.playing });
      } else if (k === "arrowright") s.nextTrack(1);
      else if (k === "arrowleft") s.nextTrack(-1);
      else if (k === "a") s.set({ autopilot: !s.autopilot });
      else if (k === "escape") s.set({ sheet: null });
      else if (k === "h") s.openSheet("home");
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") useCar.getState().set({ throttle: 0 });
      if (k === "arrowdown" || k === "s") useCar.getState().set({ brake: 0 });
    };
    const resetInput = () => useCar.getState().set({ throttle: 0, brake: 0 });
    const onVisibilityChange = () => {
      if (document.hidden) resetInput();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", resetInput);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", resetInput);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
  return null;
}

const SHORTCUTS = [
  { keys: "W / ↑", action: "Hold throttle" },
  { keys: "S / ↓", action: "Hold brake" },
  { keys: "A", action: "Toggle demo drive" },
  { keys: "M / Shift M", action: "Cycle drive mode" },
  { keys: "1–4", action: "Select drive mode" },
  { keys: "Space", action: "Play or pause music" },
  { keys: "← / →", action: "Previous or next track" },
  { keys: "H / Esc", action: "Open home or close panel" },
];

function HoldButton({ control, label }: { control: "brake" | "throttle"; label: string }) {
  const value = useCar((s) => s[control]);
  const set = useCar((s) => s.set);
  const release = () => set({ [control]: 0 });
  return (
    <button
      type="button"
      aria-label={`Hold ${label.toLowerCase()}`}
      aria-pressed={value > 0}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        set({ [control]: 1, ...(control === "throttle" ? { autopilot: false } : {}) });
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      className={`min-h-14 flex-1 touch-none rounded-xl border text-[15px] font-medium transition select-none ${value > 0 ? "border-[#2f8fff] bg-[#2f8fff]/25 text-white" : "border-white/10 bg-white/[0.06] text-white/85 active:bg-white/[0.12]"}`}
    >
      {label}
    </button>
  );
}

function ControlsTray({ close }: { close: () => void }) {
  const gear = useCar((s) => s.gear);
  const mode = useCar((s) => s.mode);
  const autopilot = useCar((s) => s.autopilot);
  const set = useCar((s) => s.set);
  const setMode = useCar((s) => s.setMode);

  useEffect(() => () => useCar.getState().set({ throttle: 0, brake: 0 }), []);

  return (
    <section id="demo-controls" aria-label="Driving controls" className="fixed right-4 bottom-16 z-[60] max-h-[44dvh] w-[min(360px,calc(100vw-32px))] overflow-y-auto overscroll-contain rounded-[20px] border border-white/15 bg-[#171a1f]/95 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl [scrollbar-width:thin] sm:right-auto sm:left-4 sm:max-h-[min(78dvh,720px)]">
      <div className="flex items-center justify-between">
        <div className="text-[16px] font-medium">Driving controls</div>
        <button type="button" onClick={close} aria-label="Close driving controls" className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"><X size={18} /></button>
      </div>
      <div className="mt-4 text-[11px] font-medium tracking-[0.1em] text-white/45 uppercase">Gear</div>
      <div className="mt-2 flex gap-2">
        {(["P", "N", "D"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value === "P" ? "Park" : value === "N" ? "Neutral" : "Drive"} gear`}
            aria-pressed={gear === value}
            onClick={() => set({ gear: value, throttle: 0, ...(value !== "D" ? { autopilot: false } : {}) })}
            className={`h-11 flex-1 rounded-xl text-[15px] font-medium transition ${gear === value ? "bg-[#2f8fff] text-white" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.12]"}`}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <HoldButton control="brake" label="Brake" />
        <HoldButton control="throttle" label="Throttle" />
      </div>
      <button
        type="button"
        aria-pressed={autopilot}
        onClick={() => set({ autopilot: !autopilot, throttle: 0, brake: 0, ...(!autopilot ? { gear: "D" as const } : {}) })}
        className={`mt-3 flex min-h-11 w-full items-center justify-between rounded-xl px-4 text-[14px] transition ${autopilot ? "bg-[#2f8fff]/20 text-[#8bc3ff] ring-1 ring-[#2f8fff]/70" : "bg-white/[0.06] text-white/70 ring-1 ring-white/10"}`}
      >
        <span>Demo drive</span><span>{autopilot ? "On" : "Off"}</span>
      </button>
      <div className="mt-5 text-[11px] font-medium tracking-[0.1em] text-white/45 uppercase">Driving mode</div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {MODE_ORDER.map((value: DriveMode) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`min-h-11 rounded-xl text-[12px] transition ${mode === value ? "bg-[#2f8fff]/25 text-white ring-1 ring-[#2f8fff]" : "bg-white/[0.06] text-white/65 ring-1 ring-white/10"}`}
          >
            {MODES[value].label}
          </button>
        ))}
      </div>
      <div className="mt-5 text-[11px] font-medium tracking-[0.1em] text-white/45 uppercase">Paint</div>
      <div className="mt-2"><PaintSwatches compact /></div>
      <div className="mt-5 text-[11px] font-medium tracking-[0.1em] text-white/45 uppercase">Keyboard shortcuts</div>
      <div className="mt-2 grid gap-2 text-[12px] text-white/65">
        {SHORTCUTS.map(({ keys, action }) => (
          <div key={keys} className="flex items-center justify-between gap-3"><span>{action}</span><kbd className="whitespace-nowrap rounded-md bg-white/[0.07] px-2 py-1 font-sans text-white/80">{keys}</kbd></div>
        ))}
      </div>
    </section>
  );
}

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const autopilot = useCar((s) => s.autopilot);
  return (
    <>
      {open && <ControlsTray close={() => setOpen(false)} />}
      <button
        type="button"
        aria-controls="demo-controls"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="fixed right-4 bottom-4 z-[60] flex h-9 items-center gap-2 rounded-full border border-white/15 bg-[#171a1f]/95 px-3 text-[12px] font-medium text-white/85 shadow-lg backdrop-blur-xl hover:bg-[#24282e] sm:right-auto sm:left-4"
      >
        <Gamepad2 size={16} /> Controls
        {autopilot && <span className="ml-1 flex items-center gap-1.5 text-[#8bc3ff]"><span className="h-1.5 w-1.5 rounded-full bg-[#2f8fff]" />Demo drive</span>}
      </button>
    </>
  );
}
