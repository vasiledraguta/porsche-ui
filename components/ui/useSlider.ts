"use client";

import { animate } from "motion";
import { useLayoutEffect, useRef } from "react";

/**
 * Motion's `layoutId` measures screen-space rects (already multiplied by the display's
 * fit-to-window scale) but animates in local space, so the highlight lands off target and
 * re-jumps on every re-render. offsetLeft/Top/Width/Height are layout values that ignore
 * transforms, so positioning from them is exact at any scale.
 */
export function useSlider<C extends HTMLElement = HTMLDivElement>(active: number) {
  const container = useRef<C>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const size = useRef("");

  useLayoutEffect(() => {
    const box = container.current;
    const ind = indicator.current;
    if (!box || !ind) return;
    const place = (spring: boolean) => {
      const el = box.querySelectorAll<HTMLElement>("[data-slot]")[active];
      if (!el) {
        animate(ind, { opacity: 0 }, { duration: 0 });
        return;
      }
      animate(
        ind,
        { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, opacity: 1 },
        spring && placed.current ? { type: "spring", stiffness: 400, damping: 33, opacity: { duration: 0.15 } } : { duration: 0 },
      );
      placed.current = true;
    };
    place(true);
    // re-place if the group itself re-flows (fonts loading, sheet opening), never animate that
    const ro = new ResizeObserver(() => {
      const next = `${box.offsetWidth}x${box.offsetHeight}`;
      if (next === size.current) return;
      size.current = next;
      place(false);
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [active]);

  return { container, indicator };
}
