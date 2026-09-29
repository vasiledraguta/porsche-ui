"use client";

import { useEffect } from "react";
import { useCar } from "@/lib/store";

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
      if (k === "?") s.set({ shortcuts: !s.shortcuts });
      else if (s.shortcuts) return;
      else if (k === "arrowup" || k === "w") s.set({ throttle: 1, autopilot: false });
      else if (k === "arrowdown" || k === "s") s.set({ brake: 1 });
      else if (e.repeat) return;
      else if (k === "m") s.cycleMode(e.shiftKey ? -1 : 1);
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
