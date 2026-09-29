"use client";

import { useSlider } from "./ui/useSlider";
import { Glyph, type AppId } from "./ui/Glyph";
import { useCar, type Sheet } from "@/lib/store";
import { hhmm, useClock } from "@/lib/useClock";

const RAIL: { id: AppId; sheet: Sheet; label: string }[] = [
  { id: "nav", sheet: null, label: "Navigation" },
  { id: "media", sheet: "media", label: "Media" },
  { id: "phone", sheet: "phone", label: "Phone" },
  { id: "vehicle", sheet: "vehicle", label: "Vehicle" },
];

export function Rail() {
  const now = useClock();
  const sheet = useCar((s) => s.sheet);
  const set = useCar((s) => s.set);
  const openSheet = useCar((s) => s.openSheet);
  const notesRead = useCar((s) => s.notesRead);
  const activeIdx = RAIL.findIndex((r) => (r.sheet === null ? sheet === null : sheet === r.sheet));
  const { container, indicator } = useSlider(activeIdx);

  return (
    <aside className="relative z-30 flex w-[78px] shrink-0 flex-col items-center bg-[#0b0c0e] pt-5 pb-4">
      <div className="text-center">
        <div className="text-[19px] leading-none font-medium tracking-tight text-white">{hhmm(now)}</div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-medium text-white/60">
          5G
          <span className="flex items-end gap-[1.5px]">
            {[3, 5, 7, 9].map((h) => (
              <span key={h} className="w-[2px] rounded-[1px] bg-white/70" style={{ height: h }} />
            ))}
          </span>
        </div>
      </div>

      <button
        onClick={() => openSheet("home")}
        aria-label="Home"
        className="relative mt-7 grid h-[54px] w-[54px] place-items-center rounded-[14px] transition active:press"
      >
        <HomeGlyph active={sheet === "home"} />
      </button>

      <div ref={container} className="relative mt-2 flex flex-col items-center gap-1.5">
        <span ref={indicator} className="pointer-events-none absolute top-0 left-0 rounded-[14px] bg-white/[0.08] opacity-0" />
        {RAIL.map((r) => {
          return (
            <button
              key={r.id}
              data-slot
              onClick={() => (r.sheet === null ? set({ sheet: null, follow: true }) : openSheet(r.sheet))}
              aria-label={r.label}
              className="relative grid h-[54px] w-[54px] place-items-center rounded-[14px] transition active:press"
            >
              <span className="relative">
                <Glyph id={r.id} size={24} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1.5">
        <button
          aria-label="Apple CarPlay"
          onClick={() => openSheet("carplay")}
          className="grid h-[54px] w-[54px] place-items-center rounded-[14px] transition active:press"
        >
          <Glyph id="carplay" size={23} />
        </button>
        <button
          aria-label="Notifications"
          onClick={() => openSheet("notifications")}
          className="relative grid h-[54px] w-[54px] place-items-center rounded-[14px] transition active:press"
        >
          <Glyph id="notifications" size={21} dim />
          {!notesRead && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#2f8fff]" />}
        </button>
      </div>
    </aside>
  );
}

function HomeGlyph({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <path d="M5 13 L14 5 L23 13 V22 H5 Z" fill={active ? "#fff" : "#e8ebef"} opacity={active ? 1 : 0.8} />
      <rect x="5" y="24" width="18" height="2" rx="1" fill="#2f8fff" />
    </svg>
  );
}
