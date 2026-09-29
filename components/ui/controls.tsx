"use client";

import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { useSlider } from "./useSlider";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) {
  return (
    <motion.button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      initial={false}
      animate={on ? "on" : "off"}
      whileTap="press"
      className="relative inline-flex h-[1.9rem] w-[3.25rem] shrink-0 items-center rounded-full transition-colors duration-300"
      style={{ background: on ? "var(--blue)" : "rgba(255,255,255,0.14)" }}
    >
      <motion.span
        className="absolute h-[1.5rem] w-[1.5rem] rounded-full bg-white shadow-[0_0.15rem_0.4rem_rgba(0,0,0,0.45)]"
        variants={{
          on: { x: "1.55rem", width: "1.5rem" },
          off: { x: "0.2rem", width: "1.5rem" },
          press: { x: on ? "1.2rem" : "0.2rem", width: "1.9rem" },
        }}
        transition={{ type: "spring", stiffness: 520, damping: 36 }}
      />
    </motion.button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { container, indicator } = useSlider(options.findIndex((o) => o.value === value));
  return (
    <div ref={container} className="relative flex rounded-[0.65rem] bg-white/[0.06] p-[0.2rem]">
      <span
        ref={indicator}
        className="pointer-events-none absolute top-0 left-0 rounded-[0.5rem] bg-[#2b2f35] opacity-0 shadow-[inset_0_0_0_0.05rem_rgba(255,255,255,0.08),0_0.15rem_0.4rem_rgba(0,0,0,0.3)]"
      />
      {options.map((o) => (
        <button
          key={o.value}
          data-slot
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="relative flex-1 rounded-[0.5rem] px-3 py-2 text-[0.9rem] transition"
        >
          <span className={`relative ${value === o.value ? "text-white" : "text-white/55"}`}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Row({
  title,
  sub,
  right,
  onClick,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`flex min-h-[3.75rem] items-center justify-between gap-4 border-b border-white/[0.07] text-left ${
        onClick ? "-mx-4 w-[calc(100%+2rem)] cursor-pointer px-4 py-4 transition hover:bg-white/[0.04]" : "w-full py-3"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[0.95rem] text-white/90">{title}</div>
        {sub && <div className="mt-0.5 text-[0.8rem] text-white/45">{sub}</div>}
      </div>
      {right}
    </Tag>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 mb-1 text-[0.75rem] font-medium tracking-[0.08em] text-white/40 uppercase">{children}</div>;
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  format = String,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  format?: (v: number) => string;
}) {
  const btn =
    "grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-white/80 transition hover:bg-white/[0.1] hover:text-white active:press disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button aria-label={`${label} down`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        <Minus size="1.05rem" strokeWidth={1.8} />
      </button>
      <span aria-live="polite" className="w-[3.65rem] text-center text-[1rem] text-white tabular-nums">
        {format(value)}
      </span>
      <button aria-label={`${label} up`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
        <Plus size="1.05rem" strokeWidth={1.8} />
      </button>
    </div>
  );
}
