"use client";

import { motion } from "motion/react";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full transition-colors duration-300"
      style={{ background: on ? "var(--blue)" : "rgba(255,255,255,0.14)" }}
    >
      <motion.span
        className="absolute h-[24px] w-[24px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        animate={{ x: on ? 25 : 3 }}
        transition={{ type: "spring", stiffness: 520, damping: 36 }}
      />
    </button>
  );
}

/** Porsche-style segmented control: flat, tight, blue highlight. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  id,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div className="flex rounded-[10px] bg-white/[0.06] p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="relative flex-1 rounded-[8px] px-3 py-2 text-[14px]"
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-[8px] bg-[#2b2f35] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.3)]"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
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
  return (
    <div
      onClick={onClick}
      className={`flex min-h-[60px] items-center justify-between gap-4 border-b border-white/[0.07] py-3 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="text-[15px] text-white/90">{title}</div>
        {sub && <div className="mt-0.5 text-[12.5px] text-white/45">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 mb-1 text-[12px] font-medium tracking-[0.08em] text-white/40 uppercase">{children}</div>;
}
