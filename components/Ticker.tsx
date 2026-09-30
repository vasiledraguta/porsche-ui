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

    const drivingKeys = new Set<string>();
    const down = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const s = useCar.getState();
      if (k === "escape") {
        if (!e.repeat && !s.shortcuts && s.sheet) {
          e.preventDefault();
          s.set({ sheet: null });
        }
        return;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (target instanceof HTMLElement && target.isContentEditable) return;
      if (target?.closest('input, textarea, select, [role="textbox"], [role="combobox"], [role="spinbutton"]')) return;
      if (
        target?.closest(
          'button, a[href], summary, [role="button"], [role="switch"], [role="slider"], [role="tab"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="option"]',
        )
      ) return;
      if (k === "?") s.set({ shortcuts: !s.shortcuts });
      else if (s.shortcuts) return;
      else if (k === "arrowup" || k === "w") {
        drivingKeys.add(k);
        s.set({ throttle: 1, autopilot: false });
      } else if (k === "arrowdown" || k === "s") {
        drivingKeys.add(k);
        s.set({ brake: 1 });
      } else if (e.repeat) return;
      else if (k === "m") s.cycleMode(e.shiftKey ? -1 : 1);
      else if (k === " ") {
        e.preventDefault();
        s.set({ playing: !s.playing });
      } else if (k === "arrowright") s.nextTrack(1);
      else if (k === "arrowleft") s.nextTrack(-1);
      else if (k === "a") s.set({ autopilot: !s.autopilot });
      else if (k === "h") s.openSheet("home");
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!drivingKeys.delete(k)) return;
      if (k === "arrowup" || k === "w") useCar.getState().set({ throttle: 0 });
      if (k === "arrowdown" || k === "s") useCar.getState().set({ brake: 0 });
    };
    const resetInput = () => {
      drivingKeys.clear();
      useCar.getState().set({ throttle: 0, brake: 0 });
    };
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
