"use client";

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

  useLayoutEffect(() => {
    const box = container.current;
    const ind = indicator.current;
    if (!box || !ind) return;
    const place = (animate: boolean) => {
      const el = box.querySelectorAll<HTMLElement>("[data-slot]")[active];
      if (!el) {
        ind.style.opacity = "0";
        return;
      }
      ind.style.transition =
        animate && placed.current
          ? "transform 320ms cubic-bezier(.2,.8,.2,1), width 320ms cubic-bezier(.2,.8,.2,1), height 320ms cubic-bezier(.2,.8,.2,1), opacity 150ms"
          : "none";
      ind.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
      ind.style.width = `${el.offsetWidth}px`;
      ind.style.height = `${el.offsetHeight}px`;
      ind.style.opacity = "1";
      placed.current = true;
    };
    place(true);
    // re-place if the group itself re-flows (fonts loading, sheet opening), never animate that
    const ro = new ResizeObserver(() => place(false));
    ro.observe(box);
    return () => ro.disconnect();
  }, [active]);

  return { container, indicator };
}
