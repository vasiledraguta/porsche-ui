"use client";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import {
  ArrowUpFromLine,
  Brush,
  CarFront,
  CircleGauge,
  DoorOpen,
  Fan,
  Flag,
  Gauge,
  Lightbulb,
  Pause,
  Phone,
  Play,
  Timer,
  Link2,
  ChevronRight,
  Delete,
  PhoneOff,
  Route,
  Search,
  ShieldCheck,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Snowflake,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import { useSlider } from "./ui/useSlider";
import { Glyph, APPS, type AppId } from "./ui/Glyph";
import { Row, Segmented, SectionTitle, Stepper, Toggle } from "./ui/controls";
import { AMBIENT, MODES, MODE_ORDER, PAINT_ORDER, PAINTS, TANK_L, TRACKS, TYRES, fmtTime, oilBar, rangeFor, tyreBar, useCar, type VehicleTab } from "@/lib/store";

const ease = [0.2, 0.8, 0.2, 1] as const;
const slide = [0.16, 1, 0.3, 1] as const;

/** Sheets slide over the map, like Tesla's controls panel and the PCM's app pages. */
export function Sheets() {
  const sheet = useCar((s) => s.sheet);
  const set = useCar((s) => s.set);
  const drag = useDragControls();
  const release = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) set({ sheet: null });
  };
  return (
    <AnimatePresence>
      {sheet && (
        <motion.div
          key={sheet}
          className="absolute inset-0 z-20 flex flex-col bg-[#121417]"
          initial={{ y: "100%" }}
          animate={{ y: 0, transition: { duration: 0.4, ease: slide } }}
          exit={{ y: "100%", transition: { duration: 0.25, ease: slide } }}
          drag="y"
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 1 }}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
          onDragEnd={release}
        >
          <div
            aria-hidden
            onPointerDown={(e) => drag.start(e)}
            className="absolute top-0 left-1/2 z-10 flex h-7 w-32 -translate-x-1/2 cursor-grab touch-none justify-center pt-2.5 active:cursor-grabbing"
          >
            <span className="h-1 w-12 rounded-full bg-white/25" />
          </div>
          <button
            onClick={() => set({ sheet: null })}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={20} />
          </button>
          {sheet === "home" && <HomeSheet />}
          {sheet === "vehicle" && <VehicleSheet />}
          {sheet === "chrono" && <ChronoSheet />}
          {sheet === "media" && <MediaSheet />}
          {sheet === "phone" && <PhoneSheet />}
          {sheet === "notifications" && <NotificationsSheet />}
          {sheet === "carplay" && <ProjectionSheet id="carplay" phone="iPhone" />}
          {sheet === "androidauto" && <ProjectionSheet id="androidauto" phone="Android phone" />}
          {sheet === "devices" && <DevicesSheet />}
          {sheet === "settings" && <SettingsSheet />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Home: the PCM app grid ---------------- */

const HOME_ORDER: AppId[] = [
  "nav",
  "media",
  "phone",
  "vehicle",
  "climate",
  "notifications",
  "chrono",
  "androidauto",
  "parking",
  "devices",
  "carplay",
  "settings",
];

function HomeSheet() {
  const s = useCar(useShallow((s) => ({ set: s.set, openSheet: s.openSheet })));
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const apps = HOME_ORDER.filter((id) => APPS[id].label.toLowerCase().includes(q));
  const open = (id: AppId) => {
    if (id === "nav") s.set({ sheet: null, follow: true });
    else if (id === "vehicle") s.openSheet("vehicle", "modes");
    else if (id === "climate") s.openSheet("vehicle", "climate");
    else if (id === "parking") s.openSheet("vehicle", "assist");
    else if (id !== "apps") s.openSheet(id);
  };
  return (
    <div className="flex h-full flex-col px-10 pt-7">
      <div className="flex items-center justify-between pr-14">
        <label className="flex w-[360px] items-center gap-3 rounded-[12px] bg-white/[0.06] px-4 py-3 text-white/45 focus-within:bg-white/[0.09]">
          <Search size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search apps"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/45"
          />
        </label>
        <div className="text-[15px] text-white/80">Driver</div>
      </div>
      <div className="mt-8 grid grid-cols-6 gap-x-4 gap-y-7">
        {apps.map((id, i) => (
          <motion.button
            key={id}
            onClick={() => open(id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.02, ease }}
            className="group flex flex-col items-center gap-2.5"
          >
            <span className="grid h-[86px] w-[86px] place-items-center rounded-[18px] bg-gradient-to-b from-[#2a2e34] to-[#1d2025] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(0,0,0,0.35)] transition group-hover:from-[#32363d] group-active:scale-95">
              <Glyph id={id} size={36} />
            </span>
            <span className="text-[14px] text-white/85">{APPS[id].label}</span>
          </motion.button>
        ))}
      </div>
      {apps.length === 0 && <div className="mt-2 text-[15px] text-white/45">No apps match “{query.trim()}”</div>}
      <div className="mt-auto mb-6 flex justify-center">
        <span className="h-[3px] w-5 rounded-full bg-[#2f8fff]" />
      </div>
    </div>
  );
}

/* ---------------- Vehicle: settings list + detail ---------------- */

const TABS: { id: VehicleTab; label: string; icon: LucideIcon }[] = [
  { id: "modes", label: "Driving modes", icon: CircleGauge },
  { id: "appearance", label: "Appearance", icon: Brush },
  { id: "chassis", label: "Chassis", icon: ArrowUpFromLine },
  { id: "setup", label: "Track setup", icon: SlidersHorizontal },
  { id: "engine", label: "Engine & fuel", icon: Timer },
  { id: "climate", label: "Climate", icon: Fan },
  { id: "lights", label: "Light & visibility", icon: Lightbulb },
  { id: "assist", label: "Assistance systems", icon: ShieldCheck },
  { id: "doors", label: "Doors & locking", icon: DoorOpen },
  { id: "trip", label: "Trip data", icon: Route },
  { id: "trackscreen", label: "Track Screen", icon: Flag },
];

function VehicleSheet() {
  const tab = useCar((s) => s.vehicleTab);
  const set = useCar((s) => s.set);
  const { container, indicator } = useSlider<HTMLElement>(TABS.findIndex((t) => t.id === tab));
  return (
    <div className="flex h-full">
      <nav ref={container} className="relative w-[270px] shrink-0 border-r border-white/[0.06] px-3 pt-6">
        <span ref={indicator} className="pointer-events-none absolute top-0 left-0 rounded-[10px] bg-white/[0.08] opacity-0" />
        <div className="mb-3 flex items-center gap-2 px-3 text-[18px] font-medium text-white">
          <CarFront size={20} strokeWidth={1.7} /> Vehicle
        </div>
        <div
          role="tablist"
          aria-label="Vehicle settings"
          aria-orientation="vertical"
          onKeyDown={(e) => {
            const i = TABS.findIndex((t) => t.id === tab);
            const next =
              e.key === "ArrowDown"
                ? (i + 1) % TABS.length
                : e.key === "ArrowUp"
                  ? (i - 1 + TABS.length) % TABS.length
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? TABS.length - 1
                      : -1;
            if (next < 0) return;
            e.preventDefault();
            e.stopPropagation();
            set({ vehicleTab: TABS[next].id });
            e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`vehicle-tab-${t.id}`}
              data-slot
              role="tab"
              aria-selected={tab === t.id}
              aria-controls="vehicle-panel"
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => set({ vehicleTab: t.id })}
              className="relative flex w-full items-center gap-3 rounded-[10px] px-3 py-[11px] text-left text-[14.5px]"
            >
              <t.icon size={18} strokeWidth={1.6} className={`relative ${tab === t.id ? "text-white" : "text-white/55"}`} />
              <span className={`relative ${tab === t.id ? "text-white" : "text-white/70"}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="relative min-w-0 flex-1 overflow-y-auto px-9 pt-7 pb-8 [scrollbar-width:none]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            id="vehicle-panel"
            role="tabpanel"
            aria-labelledby={`vehicle-tab-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="max-w-[640px]"
          >
            <h2 className="mb-2 text-[22px] font-medium text-white">{TABS.find((t) => t.id === tab)?.label}</h2>
            {tab === "modes" && <ModesTab />}
            {tab === "appearance" && <AppearanceTab />}
            {tab === "chassis" && <ChassisTab />}
            {tab === "setup" && <SetupTab />}
            {tab === "engine" && <EngineTab />}
            {tab === "climate" && <ClimateTab />}
            {tab === "lights" && <LightsTab />}
            {tab === "assist" && <AssistTab />}
            {tab === "doors" && <DoorsTab />}
            {tab === "trip" && <TripTab />}
            {tab === "trackscreen" && <TrackScreenTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ModesTab() {
  const mode = useCar((s) => s.mode);
  const setMode = useCar((s) => s.setMode);
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {MODE_ORDER.map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`rounded-[14px] p-5 text-left transition ${
            mode === m
              ? "bg-[#2f8fff]/[0.14] shadow-[inset_0_0_0_1.5px_#2f8fff]"
              : "bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-white/[0.06]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[17px] text-white">{MODES[m].label}</span>
            <Gauge size={18} className={mode === m ? "text-[#2f8fff]" : "text-white/35"} />
          </div>
          <div className="mt-2 text-[13px] leading-snug text-white/50">{MODES[m].desc}</div>
          <div className="mt-3 text-[12px] text-white/40">{MODES[m].spec}</div>
        </button>
      ))}
    </div>
  );
}

export function PaintSwatches({ compact = false }: { compact?: boolean }) {
  const paint = useCar((s) => s.paint);
  const set = useCar((s) => s.set);
  return (
    <div className={compact ? "grid grid-cols-3 gap-2" : "mt-4 grid grid-cols-3 gap-3"}>
      {PAINT_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => set({ paint: id })}
          aria-label={PAINTS[id].label}
          aria-pressed={paint === id}
          className={`flex items-center gap-2 rounded-[12px] text-left text-white transition ${compact ? "px-2 py-2 text-[11px]" : "px-4 py-4 text-[14px]"} ${paint === id ? "bg-[#2f8fff]/[0.14] ring-1 ring-[#2f8fff]" : "bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.08]"}`}
        >
          <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/20" style={{ backgroundColor: PAINTS[id].color }} />
          <span>{PAINTS[id].label}</span>
        </button>
      ))}
    </div>
  );
}

function AppearanceTab() {
  return (
    <>
      <p className="mt-3 text-[14px] text-white/50">Choose a body colour for the 911 GT3 RS.</p>
      <PaintSwatches />
    </>
  );
}

function ChassisTab() {
  const s = useCar(useShallow((s) => ({
    pasm: s.pasm,
    lift: s.lift,
    set: s.set,
  })));
  return (
    <>
      <SectionTitle>Damping (PASM)</SectionTitle>
      <div className="py-2">
        <Segmented
          value={s.pasm}
          onChange={(v) => s.set({ pasm: v })}
          options={[
            { value: "comfort", label: "Comfort" },
            { value: "sport", label: "Sport" },
          ]}
        />
      </div>
      <SectionTitle>Front axle</SectionTitle>
      <Row
        title="Lift system"
        sub="Raises the front axle for ramps and kerbs. Saved by location."
        right={<Toggle on={s.lift} onChange={() => s.set({ lift: !s.lift })} />}
      />
    </>
  );
}

const clicks = (v: number) => (v === 0 ? "Base" : v > 0 ? `+${v}` : `${v}`);

function SetupTab() {
  const s = useCar(useShallow((s) => ({
    reboundF: s.reboundF,
    compressionF: s.compressionF,
    reboundR: s.reboundR,
    compressionR: s.compressionR,
    diffCoast: s.diffCoast,
    diffDrive: s.diffDrive,
    tc: s.tc,
    esc: s.esc,
    set: s.set,
  })));
  const damper = (title: string, key: "reboundF" | "compressionF" | "reboundR" | "compressionR") => (
    <Row
      title={title}
      sub="Clicks from base · minus is softer"
      right={<Stepper label={title} value={s[key]} min={-5} max={5} format={clicks} onChange={(v) => s.set({ [key]: v })} />}
    />
  );
  return (
    <>
      <SectionTitle>Damping · front axle</SectionTitle>
      {damper("Front rebound", "reboundF")}
      {damper("Front compression", "compressionF")}
      <SectionTitle>Damping · rear axle</SectionTitle>
      {damper("Rear rebound", "reboundR")}
      {damper("Rear compression", "compressionR")}
      <SectionTitle>Rear differential lock</SectionTitle>
      <Row
        title="Coast"
        sub="Lock off throttle · higher is more stable on entry"
        right={<Stepper label="Coast lock" value={s.diffCoast} min={1} max={5} onChange={(v) => s.set({ diffCoast: v })} />}
      />
      <Row
        title="Drive"
        sub="Lock on throttle · higher is more traction on exit"
        right={<Stepper label="Drive lock" value={s.diffDrive} min={1} max={5} onChange={(v) => s.set({ diffDrive: v })} />}
      />
      <SectionTitle>Traction control (TC)</SectionTitle>
      <Row
        title="TC stage"
        sub="Lower allows more wheelspin"
        right={<Stepper label="TC stage" value={s.tc} min={0} max={8} format={(v) => (v === 0 ? "Off" : `${v}`)} onChange={(v) => s.set({ tc: v })} />}
      />
      <SectionTitle>Stability control (ESC)</SectionTitle>
      <div className="py-2">
        <Segmented
          value={s.esc}
          onChange={(v) => s.set({ esc: v })}
          options={[
            { value: "on", label: "On" },
            { value: "sport", label: "Sport" },
            { value: "off", label: "Off" },
          ]}
        />
      </div>
    </>
  );
}

function EngineTab() {
  const s = useCar(useShallow((s) => ({
    rpm: s.rpm,
    oilTemp: s.oilTemp,
    coolantTemp: s.coolantTemp,
    gear: s.gear,
    pdkGear: s.pdkGear,
    powerKw: s.powerKw,
    fuel: s.fuel,
    mode: s.mode,
    exhaust: s.exhaust,
    startStop: s.startStop,
    fuelFlap: s.fuelFlap,
    set: s.set,
  })));
  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Tile label="Engine speed" value={`${(Math.round(s.rpm / 50) * 50).toLocaleString("en")} rpm`} />
        <Tile label="Oil temperature" value={`${Math.round(s.oilTemp)} °C`} />
        <Tile label="Coolant" value={`${Math.round(s.coolantTemp)} °C`} />
        <Tile label="Oil pressure" value={`${oilBar(s.rpm).toFixed(1)} bar`} />
        <Tile label="PDK gear" value={s.gear === "D" ? `${s.pdkGear} / 7` : s.gear} />
        <Tile label="Power output" value={`${Math.round(s.powerKw)} kW`} />
      </div>
      <SectionTitle>Fuel · {Math.round(s.fuel)}% · {rangeFor(s.fuel, s.mode)} km range</SectionTitle>
      <div className="relative mt-1 mb-2 h-3 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${s.fuel}%`, background: s.fuel < 12 ? "#ffb020" : "#f2f4f7" }}
        />
      </div>
      <div className="text-[12px] text-white/40 tabular-nums">
        {((s.fuel / 100) * TANK_L).toFixed(0)} of {TANK_L} L · Super Plus 98 RON
      </div>
      <Row
        title="Sports exhaust"
        sub={s.exhaust ? "Valves open" : "Valves closed"}
        right={<Toggle on={s.exhaust} onChange={() => s.set({ exhaust: !s.exhaust })} />}
      />
      <Row
        title="Auto start/stop"
        sub="Switches the engine off when stationary"
        right={<Toggle on={s.startStop} onChange={() => s.set({ startStop: !s.startStop })} />}
      />
      <Row
        title="Fuel filler flap"
        sub={s.fuelFlap ? "Unlocked" : "Locked"}
        right={<Toggle on={s.fuelFlap} onChange={() => s.set({ fuelFlap: !s.fuelFlap })} />}
      />
    </>
  );
}

function ClimateTab() {
  const s = useCar(useShallow((s) => ({
    acMax: s.acMax,
    auto: s.auto,
    defrost: s.defrost,
    sync: s.sync,
    tempL: s.tempL,
    fan: s.fan,
    ventFocus: s.ventFocus,
    rearDefrost: s.rearDefrost,
    set: s.set,
  })));
  return (
    <>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <ClimateKey icon={Snowflake} label="A/C MAX" on={s.acMax} onClick={() => s.set({ acMax: !s.acMax })} />
        <ClimateKey icon={Fan} label="AUTO" on={s.auto} onClick={() => s.set({ auto: !s.auto })} />
        <ClimateKey icon={Wind} label="Defrost" on={s.defrost} onClick={() => s.set({ defrost: !s.defrost })} />
        <ClimateKey icon={Link2} label="SYNC" on={s.sync} onClick={() => s.set(s.sync ? { sync: false } : { sync: true, tempR: s.tempL })} />
      </div>
      <SectionTitle>Fan · {s.auto ? "Auto" : s.fan}</SectionTitle>
      <input
        type="range"
        min={1}
        max={7}
        value={s.fan}
        onChange={(e) => s.set({ fan: Number(e.target.value), auto: false })}
        className="slim"
        aria-label="Fan"
        style={{ ["--pct" as string]: `${((s.fan - 1) / 6) * 100}%` }}
      />
      <SectionTitle>Airflow (smart vents)</SectionTitle>
      <div className="py-2">
        <Segmented
          value={s.ventFocus}
          onChange={(v) => s.set({ ventFocus: v })}
          options={[
            { value: "driver", label: "Driver" },
            { value: "diffuse", label: "Diffuse" },
            { value: "passenger", label: "Passenger" },
          ]}
        />
      </div>
      <Row title="Rear window heating" sub="Switches off automatically after 15 minutes" right={<Toggle on={s.rearDefrost} onChange={() => s.set({ rearDefrost: !s.rearDefrost })} />} />
    </>
  );
}

function ClimateKey({ icon: Icon, label, on, onClick }: { icon: LucideIcon; label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[78px] flex-col items-center justify-center gap-2 rounded-[14px] transition ${
        on ? "bg-[#2f8fff]/[0.16] text-[#6db3ff] shadow-[inset_0_0_0_1.5px_#2f8fff]" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.08]"
      }`}
    >
      <Icon size={22} strokeWidth={1.6} />
      <span className="text-[12px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

function LightsTab() {
  const s = useCar(useShallow((s) => ({
    headlights: s.headlights,
    ambient: s.ambient,
    ambientLevel: s.ambientLevel,
    set: s.set,
  })));
  return (
    <>
      <SectionTitle>Headlights</SectionTitle>
      <div className="py-2">
        <Segmented
          value={s.headlights}
          onChange={(v) => s.set({ headlights: v })}
          options={[
            { value: "off", label: "Off" },
            { value: "auto", label: "Auto" },
            { value: "low", label: "Low beam" },
            { value: "high", label: "HD Matrix" },
          ]}
        />
      </div>
      <SectionTitle>Ambient lighting</SectionTitle>
      <div className="flex gap-3 py-3">
        {AMBIENT.map((c, i) => (
          <button
            key={c}
            aria-label={`Ambient ${i}`}
            onClick={() => s.set({ ambient: i })}
            className="h-10 w-10 rounded-full transition"
            style={{
              background: c,
              boxShadow: s.ambient === i ? `0 0 0 3px #121417, 0 0 0 5px ${c}, 0 0 20px ${c}` : "inset 0 0 0 1px rgba(0,0,0,.3)",
            }}
          />
        ))}
      </div>
      <div className="py-2">
        <input
          type="range"
          min={0}
          max={100}
          value={s.ambientLevel}
          onChange={(e) => s.set({ ambientLevel: Number(e.target.value) })}
          className="slim"
          aria-label="Ambient brightness"
          style={{ ["--pct" as string]: `${s.ambientLevel}%`, ["--fill" as string]: AMBIENT[s.ambient] }}
        />
      </div>
    </>
  );
}

function AssistTab() {
  const s = useCar(useShallow((s) => ({
    innodrive: s.innodrive,
    lane: s.lane,
    signs: s.signs,
    parkAssist: s.parkAssist,
    set: s.set,
  })));
  return (
    <>
      <Row title="Porsche InnoDrive" sub="Adaptive cruise that anticipates corners and limits" right={<Toggle on={s.innodrive} onChange={() => s.set({ innodrive: !s.innodrive })} />} />
      <Row title="Lane keeping assist" sub="With emergency steering assist" right={<Toggle on={s.lane} onChange={() => s.set({ lane: !s.lane })} />} />
      <Row title="Traffic sign recognition" sub="Shows the speed limit on the map" right={<Toggle on={s.signs} onChange={() => s.set({ signs: !s.signs })} />} />
      <Row title="Park Assist" sub="Surround view with 3D car" right={<Toggle on={s.parkAssist} onChange={() => s.set({ parkAssist: !s.parkAssist })} />} />
    </>
  );
}

function DoorsTab() {
  const s = useCar(useShallow((s) => ({
    locked: s.locked,
    frunkOpen: s.frunkOpen,
    trunkOpen: s.trunkOpen,
    doorL: s.doorL,
    doorR: s.doorR,
    comfortAccess: s.comfortAccess,
    toggleLock: s.toggleLock,
    togglePart: s.togglePart,
    set: s.set,
  })));
  return (
    <>
      <Row title="Central locking" sub={s.locked ? "Locked" : "Unlocked"} right={<Toggle on={s.locked} onChange={s.toggleLock} />} />
      <Row title="Front trunk" sub={s.frunkOpen ? "Open" : "Closed"} right={<Toggle on={s.frunkOpen} onChange={() => s.togglePart("hood")} />} />
      <Row title="Engine lid" sub={s.trunkOpen ? "Open" : "Closed"} right={<Toggle on={s.trunkOpen} onChange={() => s.togglePart("trunk")} />} />
      <Row title="Driver door" sub={s.doorL ? "Open" : "Closed"} right={<Toggle on={s.doorL} onChange={() => s.togglePart("doorL")} />} />
      <Row title="Passenger door" sub={s.doorR ? "Open" : "Closed"} right={<Toggle on={s.doorR} onChange={() => s.togglePart("doorR")} />} />
      <Row title="Comfort access" sub="Unlock when you approach with the key" right={<Toggle on={s.comfortAccess} onChange={() => s.set({ comfortAccess: !s.comfortAccess })} />} />
    </>
  );
}

function TripTab() {
  const s = useCar(useShallow((s) => ({
    tripD: s.tripD,
    tripFuelL: s.tripFuelL,
    tripTime: s.tripTime,
    odo: s.odo,
  })));
  const km = s.tripD / 1000;
  const cons = km > 0.2 ? (s.tripFuelL / km) * 100 : 0;
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      <Tile label="Since start" value={`${km.toFixed(1)} km`} />
      <Tile label="Driving time" value={fmtTime(s.tripTime)} />
      <Tile label="Avg. consumption" value={km > 0.2 ? `${cons.toFixed(1)} l/100 km` : "– l/100 km"} />
      <Tile label="Fuel used" value={`${s.tripFuelL.toFixed(2)} l`} />
      <Tile label="Odometer" value={`${Math.floor(s.odo).toLocaleString("en")} km`} />
      <Tile label="Tyre pressure" value="2.8 bar" />
    </div>
  );
}

function TrackScreenTab() {
  const s = useCar(useShallow((s) => ({
    tyreTemp: s.tyreTemp,
    oilTemp: s.oilTemp,
    rpm: s.rpm,
  })));
  return (
    <>
      <SectionTitle>Tyres · pressure and temperature</SectionTitle>
      <div className="mt-2 grid grid-cols-[1fr_72px_1fr] grid-rows-2 gap-3">
        {TYRES.map((label, i) => (
          <div key={label} className={i % 2 ? "col-start-3" : "col-start-1"}>
            <Tile label={label} value={`${tyreBar(i, s.tyreTemp[i]).toFixed(2)} bar`} sub={<TyreTemp temp={s.tyreTemp[i]} />} />
          </div>
        ))}
        <div className="col-start-2 row-span-2 row-start-1 rounded-[26px] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.1)]" />
      </div>
      <SectionTitle>Engine oil</SectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Tile label="Oil temperature" value={`${Math.round(s.oilTemp)} °C`} />
        <Tile label="Oil pressure" value={`${oilBar(s.rpm).toFixed(1)} bar`} />
      </div>
    </>
  );
}

function TyreTemp({ temp }: { temp: number }) {
  const [color, state] = temp < 70 ? ["#6db3ff", "Cold"] : temp <= 100 ? ["#3fd46b", "In window"] : ["#ffb020", "Hot"];
  return (
    <span className="flex items-center gap-2 tabular-nums">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {Math.round(temp)} °C · {state}
    </span>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <div className="text-[12px] text-white/45">{label}</div>
      <div className="mt-1.5 text-[22px] font-light text-white tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-[13px] text-white/60">{sub}</div>}
    </div>
  );
}

const fmtLap = (ms: number) => {
  const cs = Math.floor(ms / 10);
  return `${Math.floor(cs / 6000)}:${String(Math.floor(cs / 100) % 60).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
};

function ChronoSheet() {
  const elapsed = useCar((s) => s.chronoBase + (s.chronoRunning ? s.now - s.chronoAt : 0));
  const running = useCar((s) => s.chronoRunning);
  const splits = useCar((s) => s.laps);
  const toggleChrono = useCar((s) => s.toggleChrono);
  const lapChrono = useCar((s) => s.lapChrono);
  const laps = splits.map((t, i) => t - (splits[i - 1] ?? 0));
  const best = laps.length ? Math.min(...laps) : 0;
  const current = elapsed - (splits.at(-1) ?? 0);
  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <div className="flex items-center gap-2 text-[13px] text-white/50">
          <Glyph id="chrono" size={15} /> Sport Chrono · Stopwatch
        </div>
        <ChronoDial ms={elapsed} />
        <div className="text-center">
          <div className="text-[44px] leading-none font-light text-white tabular-nums">{fmtLap(elapsed)}</div>
          <div className="mt-2 text-[14px] text-white/45 tabular-nums">
            Lap {laps.length + 1} · {fmtLap(current)}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={lapChrono}
            disabled={!running && elapsed === 0}
            className="h-[52px] w-[120px] rounded-full bg-white/[0.08] text-[15px] text-white transition hover:bg-white/[0.12] active:scale-95 disabled:opacity-30"
          >
            {running || elapsed === 0 ? "Lap" : "Reset"}
          </button>
          <button
            onClick={toggleChrono}
            className={`h-[52px] w-[120px] rounded-full text-[15px] font-medium transition active:scale-95 ${
              running ? "bg-[#ff4a4a]/20 text-[#ff7a70] hover:bg-[#ff4a4a]/30" : "bg-[#3fd46b]/20 text-[#5fe086] hover:bg-[#3fd46b]/30"
            }`}
          >
            {running ? "Stop" : elapsed ? "Resume" : "Start"}
          </button>
        </div>
      </div>
      <div className="w-[340px] shrink-0 overflow-y-auto border-l border-white/[0.06] bg-black/20 px-5 pt-16 pb-6 [scrollbar-width:none]">
        <div className="mb-2 text-[12px] font-medium tracking-[0.08em] text-white/40 uppercase">Laps</div>
        {laps.length === 0 && <div className="text-[14px] text-white/40">Press Lap to record a lap time</div>}
        {laps
          .map((t, i) => ({ t, n: i + 1 }))
          .reverse()
          .map(({ t, n }) => (
            <div key={n} className="flex items-center justify-between border-b border-white/[0.07] py-3 tabular-nums">
              <span className="text-[14px] text-white/55">Lap {n}</span>
              <span className="flex items-baseline gap-3">
                {laps.length > 1 && (
                  <span className={`text-[12.5px] ${t === best ? "text-[#3fd46b]" : "text-white/40"}`}>
                    {t === best ? "Best" : `+${((t - best) / 1000).toFixed(2)}`}
                  </span>
                )}
                <span className={`text-[17px] ${t === best && laps.length > 1 ? "text-[#3fd46b]" : "text-white"}`}>{fmtLap(t)}</span>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function ChronoDial({ ms }: { ms: number }) {
  const sec = ((ms / 1000) % 60) * 6;
  const min = ((ms / 60000) % 30) * 12;
  return (
    <svg width="300" height="300" viewBox="-150 -150 300 300" role="img" aria-label="Stopwatch dial">
      <circle r="146" fill="#0b0c0e" stroke="rgba(255,255,255,0.14)" strokeWidth="3" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="0"
          y1={-134}
          x2="0"
          y2={i % 5 ? -126 : -116}
          stroke={i % 5 ? "rgba(255,255,255,0.4)" : "#fff"}
          strokeWidth={i % 5 ? 1.5 : 3}
          transform={`rotate(${i * 6})`}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        return (
          <text key={i} x={Math.sin(a) * 98} y={-Math.cos(a) * 98 + 6} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="17">
            {(i + 1) * 5}
          </text>
        );
      })}
      <g transform="translate(0 48)">
        <circle r="30" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        {Array.from({ length: 30 }, (_, i) => (
          <line key={i} x1="0" y1={-28} x2="0" y2={i % 5 ? -25 : -21} stroke="rgba(255,255,255,0.5)" strokeWidth="1" transform={`rotate(${i * 12})`} />
        ))}
        <line x1="0" y1="4" x2="0" y2="-24" stroke="#fff" strokeWidth="2" strokeLinecap="round" transform={`rotate(${min})`} />
      </g>
      <line x1="0" y1="22" x2="0" y2="-132" stroke="#ff5a4e" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${sec})`} />
      <circle r="6" fill="#ff5a4e" />
    </svg>
  );
}

/* ---------------- Media ---------------- */

function MediaSheet() {
  const s = useCar(useShallow((s) => ({
    track: s.track,
    progress: s.progress,
    playing: s.playing,
    seeking: s.seeking,
    nextTrack: s.nextTrack,
    set: s.set,
  })));
  const t = TRACKS[s.track];
  const seekAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * t.length;
  };

  useEffect(() => () => useCar.getState().set({ seeking: false }), []);
  return (
    <div className="relative flex h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: `radial-gradient(60% 70% at 25% 40%, hsl(${t.hue} 60% 28% / .55), transparent 70%)` }}
      />
      <div className="relative flex flex-1 items-center gap-10 px-12">
        <div className="shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
          <AlbumArt size={280} radius={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[13px] text-white/50">
            <Glyph id="media" size={15} /> Porsche Radio · Dolby Atmos
          </div>
          <div className="mt-3 text-[34px] leading-tight font-medium text-white">{t.title}</div>
          <div className="text-[18px] text-white/60">{t.artist}</div>
          <div className="text-[14px] text-white/35">{t.album}</div>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={t.length}
            aria-valuenow={Math.round(s.progress)}
            aria-valuetext={`${fmtTime(s.progress)} of ${fmtTime(t.length)}`}
            className="group relative mt-8 h-5 cursor-pointer touch-none rounded-full outline-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/50"
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              s.set({ progress: seekAt(e), seeking: true });
            }}
            onPointerMove={(e) => {
              if (s.seeking) s.set({ progress: seekAt(e) });
            }}
            onPointerUp={(e) => {
              if (!s.seeking) return;
              s.set({ progress: seekAt(e), seeking: false });
            }}
            onPointerCancel={() => s.set({ seeking: false })}
            onKeyDown={(e) => {
              const step = e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0;
              if (!step) return;
              e.preventDefault();
              e.stopPropagation();
              s.set({ progress: Math.min(t.length, Math.max(0, s.progress + step)) });
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-white/15" />
            <div className="absolute top-1/2 left-0 h-[4px] -translate-y-1/2 rounded-full bg-white" style={{ width: `${(s.progress / t.length) * 100}%` }} />
            <div
              className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-opacity ${
                s.seeking ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
              style={{ left: `${(s.progress / t.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[12px] text-white/45 tabular-nums">
            <span>{fmtTime(s.progress)}</span>
            <span>-{fmtTime(t.length - s.progress)}</span>
          </div>
          <div className="mt-5 flex items-center gap-8 text-white">
            <button aria-label="Previous" onClick={() => s.nextTrack(-1)} className="opacity-80 hover:opacity-100">
              <SkipBack size={30} fill="currentColor" strokeWidth={1} />
            </button>
            <button
              aria-label="Play/pause"
              onClick={() => s.set({ playing: !s.playing })}
              className="grid h-[68px] w-[68px] place-items-center rounded-full bg-white text-black transition active:scale-95"
            >
              {s.playing ? <Pause size={28} fill="currentColor" strokeWidth={0} /> : <Play size={28} fill="currentColor" strokeWidth={0} className="translate-x-0.5" />}
            </button>
            <button aria-label="Next" onClick={() => s.nextTrack(1)} className="opacity-80 hover:opacity-100">
              <SkipForward size={30} fill="currentColor" strokeWidth={1} />
            </button>
          </div>
        </div>
      </div>
      <div className="relative w-[300px] shrink-0 border-l border-white/[0.06] bg-black/20 px-5 pt-16">
        <div className="mb-2 text-[12px] font-medium tracking-[0.08em] text-white/40 uppercase">Up next</div>
        {TRACKS.map((tr, i) => (
          <button
            key={tr.title}
            onClick={() => s.set({ track: i, progress: 0, playing: true })}
            className={`flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition hover:bg-white/[0.05] ${i === s.track ? "bg-white/[0.07]" : ""}`}
          >
            <span className="h-9 w-9 shrink-0 rounded-[6px]" style={{ background: `linear-gradient(135deg, hsl(${tr.hue} 60% 50%), hsl(${(tr.hue + 50) % 360} 55% 22%))` }} />
            <span className="min-w-0">
              <span className={`block truncate text-[14px] ${i === s.track ? "text-[#ff5a5a]" : "text-white/90"}`}>{tr.title}</span>
              <span className="block truncate text-[12px] text-white/45">{tr.artist}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Phone ---------------- */

const CONTACTS = [
  { n: "Alex Carter", sub: "Mobile", kind: "Mobile", fav: true, c: "#ff8a5c" },
  { n: "Sam Becker", sub: "Mobile · Missed 10:12", kind: "Mobile", fav: true, c: "#39a6ff" },
  { n: "Office", sub: "Work", kind: "Work", fav: false, c: "#3fd46b" },
  { n: "Porsche Zentrum", sub: "Service", kind: "Service", fav: true, c: "#d4b88c" },
  { n: "Jordan Lee", sub: "Mobile", kind: "Mobile", fav: false, c: "#a57bff" },
];

const MESSAGES = [
  { n: "Sam Becker", text: "Running 10 minutes late, see you at departures", time: "10:14" },
  { n: "Porsche Zentrum", text: "Your service appointment is confirmed for Tuesday", time: "Yesterday" },
  { n: "Alex Carter", text: "Landing at 18:20", time: "Mon" },
];

const PHONE_TABS = ["Favourites", "Recent calls", "Contacts", "Keypad", "Messages"] as const;
type PhoneTab = (typeof PHONE_TABS)[number];

function PhoneSheet() {
  const [tab, setTab] = useState<PhoneTab>("Recent calls");
  const [call, setCall] = useState<{ to: string; at: number } | null>(null);
  const { container, indicator } = useSlider<HTMLElement>(PHONE_TABS.indexOf(tab));
  const dial = (to: string) => setCall({ to, at: useCar.getState().now });
  const list =
    tab === "Favourites" ? CONTACTS.filter((c) => c.fav) : tab === "Contacts" ? [...CONTACTS].sort((a, b) => a.n.localeCompare(b.n)) : CONTACTS;
  return (
    <div className="flex h-full">
      <nav ref={container} className="relative w-[270px] shrink-0 border-r border-white/[0.06] px-3 pt-6">
        <span ref={indicator} className="pointer-events-none absolute top-0 left-0 rounded-[10px] bg-white/[0.08] opacity-0" />
        <div className="mb-3 flex items-center gap-2 px-3 text-[18px] font-medium text-white">
          <Glyph id="phone" size={20} /> Phone
        </div>
        {PHONE_TABS.map((l) => (
          <button
            key={l}
            data-slot
            onClick={() => setTab(l)}
            className="relative flex w-full rounded-[10px] px-3 py-[11px] text-left text-[14.5px]"
          >
            <span className={`relative ${tab === l ? "text-white" : "text-white/70"}`}>{l}</span>
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1 overflow-y-auto px-9 pt-7 pb-8 [scrollbar-width:none]">
        <h2 className="mb-3 text-[22px] font-medium text-white">{tab}</h2>
        {call && <CallBanner to={call.to} at={call.at} onEnd={() => setCall(null)} />}
        {tab === "Keypad" ? (
          <Keypad onCall={dial} />
        ) : tab === "Messages" ? (
          MESSAGES.map((m) => <Row key={m.n} title={m.n} sub={m.text} right={<span className="shrink-0 text-[12.5px] text-white/40">{m.time}</span>} />)
        ) : (
          list.map((c) => (
            <Row
              key={c.n}
              title={c.n}
              sub={tab === "Recent calls" ? c.sub : c.kind}
              right={
                <button
                  onClick={() => dial(c.n)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#3fd46b]/15 text-[#3fd46b] transition hover:bg-[#3fd46b]/25 active:scale-95"
                  aria-label={`Call ${c.n}`}
                >
                  <Phone size={17} fill="currentColor" strokeWidth={0} />
                </button>
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function CallBanner({ to, at, onEnd }: { to: string; at: number; onEnd: () => void }) {
  const now = useCar((s) => s.now);
  const t = (now - at) / 1000;
  return (
    <div className="mb-3 flex items-center gap-4 rounded-[14px] bg-[#3fd46b]/[0.1] px-5 py-4 shadow-[inset_0_0_0_1px_rgba(63,212,107,0.3)]">
      <Phone size={18} fill="currentColor" strokeWidth={0} className="shrink-0 text-[#3fd46b]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] text-white">{to}</div>
        <div className="text-[13px] text-white/55 tabular-nums">{t < 3 ? "Calling…" : fmtTime(t - 3)}</div>
      </div>
      <button
        aria-label="End call"
        onClick={onEnd}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ff4a4a] text-white transition hover:bg-[#ff5f5f] active:scale-95"
      >
        <PhoneOff size={18} />
      </button>
    </div>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

function Keypad({ onCall }: { onCall: (to: string) => void }) {
  const [digits, setDigits] = useState("");
  return (
    <div className="w-[300px]">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-white/[0.07]">
        {digits ? (
          <span className="min-w-0 truncate text-[28px] font-light text-white tabular-nums">{digits}</span>
        ) : (
          <span className="text-[15px] text-white/35">Enter a number</span>
        )}
        {digits && (
          <button
            aria-label="Delete digit"
            onClick={() => setDigits((d) => d.slice(0, -1))}
            className="grid h-10 w-10 shrink-0 place-items-center text-white/60 transition hover:text-white"
          >
            <Delete size={20} strokeWidth={1.7} />
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => setDigits((d) => (d + k).slice(0, 15))}
            className="h-14 rounded-[14px] bg-white/[0.05] text-[22px] text-white transition hover:bg-white/[0.08] active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>
      <button
        aria-label="Call"
        disabled={!digits}
        onClick={() => onCall(digits)}
        className="mx-auto mt-5 grid h-14 w-14 place-items-center rounded-full bg-[#3fd46b] text-black transition active:scale-95 disabled:opacity-30"
      >
        <Phone size={20} fill="currentColor" strokeWidth={0} />
      </button>
    </div>
  );
}

/* ---------------- Other apps ---------------- */

function AppPage({ id, children }: { id: AppId; children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto px-10 pt-7 pb-8 [scrollbar-width:none]">
      <div className="max-w-[640px]">
        <h2 className="mb-3 flex items-center gap-2 text-[22px] font-medium text-white">
          <Glyph id={id} size={20} /> {APPS[id].label}
        </h2>
        {children}
      </div>
    </div>
  );
}

function RowMeta({ children }: { children?: React.ReactNode }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-[12.5px] text-white/40">
      {children}
      <ChevronRight size={16} />
    </span>
  );
}

function NotificationsSheet() {
  const openSheet = useCar((s) => s.openSheet);
  const notes = [
    { title: "Missed call", sub: "Sam Becker", time: "10:12", open: () => openSheet("phone") },
    { title: "Service due in 4,200 km", sub: "Oil change and inspection", time: "Today", open: () => openSheet("vehicle", "engine") },
    { title: "Tyre pressure checked", sub: "All four tyres at 2.8 bar", time: "08:05", open: () => openSheet("vehicle", "trip") },
  ];
  return (
    <AppPage id="notifications">
      {notes.map((n) => (
        <Row key={n.title} title={n.title} sub={n.sub} onClick={n.open} right={<RowMeta>{n.time}</RowMeta>} />
      ))}
    </AppPage>
  );
}

function ProjectionSheet({ id, phone }: { id: "carplay" | "androidauto"; phone: string }) {
  const openSheet = useCar((s) => s.openSheet);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-10 text-center">
      <span className="grid h-[96px] w-[96px] place-items-center rounded-[22px] bg-gradient-to-b from-[#2a2e34] to-[#1d2025] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(0,0,0,0.35)]">
        <Glyph id={id} size={44} />
      </span>
      <h2 className="text-[26px] font-medium text-white">{APPS[id].label}</h2>
      <p className="max-w-[420px] text-[15px] leading-relaxed text-white/55">
        No {phone} connected. Plug it into the USB-C port in the centre console, or pair it wirelessly from Devices.
      </p>
      <button
        onClick={() => openSheet("devices")}
        className="mt-2 rounded-[12px] bg-white/[0.08] px-5 py-3 text-[15px] text-white transition hover:bg-white/[0.12] active:scale-95"
      >
        Open Devices
      </button>
    </div>
  );
}

function DevicesSheet() {
  const s = useCar(useShallow((s) => ({
    bluetooth: s.bluetooth,
    hotspot: s.hotspot,
    set: s.set,
  })));
  return (
    <AppPage id="devices">
      <SectionTitle>Paired devices</SectionTitle>
      <Row title="iPhone" sub={s.bluetooth ? "Connected · Phone and audio" : "Not connected"} />
      <Row title="Android phone" sub="Not connected" />
      <SectionTitle>Connections</SectionTitle>
      <Row title="Bluetooth" sub={s.bluetooth ? "On" : "Off"} right={<Toggle on={s.bluetooth} onChange={() => s.set({ bluetooth: !s.bluetooth })} />} />
      <Row
        title="Wi-Fi hotspot"
        sub={s.hotspot ? "Sharing the car's 5G connection" : "Off"}
        right={<Toggle on={s.hotspot} onChange={() => s.set({ hotspot: !s.hotspot })} />}
      />
    </AppPage>
  );
}

function SettingsSheet() {
  const openSheet = useCar((s) => s.openSheet);
  const items = [
    { title: "Vehicle", sub: "Driving modes, chassis, lights and doors", open: () => openSheet("vehicle", "modes") },
    { title: "Air conditioning", sub: "Temperature, fan and airflow", open: () => openSheet("vehicle", "climate") },
    { title: "Devices", sub: "Bluetooth, Wi-Fi hotspot and paired phones", open: () => openSheet("devices") },
    { title: "Notifications", sub: "Calls, messages and vehicle alerts", open: () => openSheet("notifications") },
  ];
  return (
    <AppPage id="settings">
      {items.map((it) => (
        <Row key={it.title} title={it.title} sub={it.sub} onClick={it.open} right={<RowMeta />} />
      ))}
      <Row title="Software" sub="PCM 6 · Up to date" />
    </AppPage>
  );
}
