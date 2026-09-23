"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpFromLine,
  CarFront,
  CircleGauge,
  DoorOpen,
  Fan,
  Gauge,
  Lightbulb,
  Pause,
  Phone,
  Play,
  Timer,
  Route,
  Search,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Snowflake,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import { Glyph, APPS, type AppId } from "./ui/Glyph";
import { Row, Segmented, SectionTitle, Toggle } from "./ui/controls";
import { AMBIENT, MODES, MODE_ORDER, REDLINE, TANK_L, TRACKS, fmtTime, rangeFor, useCar, type VehicleTab } from "@/lib/store";

const ease = [0.2, 0.8, 0.2, 1] as const;

/** Sheets slide over the map, like Tesla's controls panel and the PCM's app pages. */
export function Sheets() {
  const sheet = useCar((s) => s.sheet);
  const set = useCar((s) => s.set);
  return (
    <AnimatePresence>
      {sheet && (
        <motion.div
          key={sheet}
          className="absolute inset-0 z-20 flex flex-col bg-[#121417]"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.32, ease }}
        >
          <button
            onClick={() => set({ sheet: null })}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={20} />
          </button>
          {sheet === "home" && <HomeSheet />}
          {sheet === "vehicle" && <VehicleSheet />}
          {sheet === "media" && <MediaSheet />}
          {sheet === "phone" && <PhoneSheet />}
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
  const s = useCar();
  const open = (id: AppId) => {
    if (id === "nav") s.set({ sheet: null, follow: true });
    else if (id === "media") s.openSheet("media");
    else if (id === "phone") s.openSheet("phone");
    else if (id === "chrono") s.openSheet("vehicle", "engine");
    else if (id === "climate") s.openSheet("vehicle", "climate");
    else if (id === "parking") s.openSheet("vehicle", "assist");
    else s.openSheet("vehicle", "modes");
  };
  return (
    <div className="flex h-full flex-col px-10 pt-7">
      <div className="flex items-center justify-between pr-14">
        <div className="flex w-[360px] items-center gap-3 rounded-[12px] bg-white/[0.06] px-4 py-3 text-white/45">
          <Search size={18} />
          <span className="text-[15px]">Search</span>
        </div>
        <div className="text-[15px] text-white/80">Driver ▾</div>
      </div>
      <div className="mt-8 grid grid-cols-6 gap-x-4 gap-y-7">
        {HOME_ORDER.map((id, i) => (
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
      <div className="mt-auto mb-6 flex justify-center gap-2">
        <span className="h-[3px] w-5 rounded-full bg-[#2f8fff]" />
        <span className="h-[3px] w-5 rounded-full bg-white/15" />
        <span className="h-[3px] w-5 rounded-full bg-white/15" />
      </div>
    </div>
  );
}

/* ---------------- Vehicle: settings list + detail ---------------- */

const TABS: { id: VehicleTab; label: string; icon: LucideIcon }[] = [
  { id: "modes", label: "Driving modes", icon: CircleGauge },
  { id: "chassis", label: "Chassis", icon: ArrowUpFromLine },
  { id: "engine", label: "Engine & fuel", icon: Timer },
  { id: "climate", label: "Climate", icon: Fan },
  { id: "lights", label: "Light & visibility", icon: Lightbulb },
  { id: "assist", label: "Assistance systems", icon: ShieldCheck },
  { id: "doors", label: "Doors & locking", icon: DoorOpen },
  { id: "trip", label: "Trip data", icon: Route },
];

function VehicleSheet() {
  const tab = useCar((s) => s.vehicleTab);
  const set = useCar((s) => s.set);
  return (
    <div className="flex h-full">
      <nav className="w-[270px] shrink-0 border-r border-white/[0.06] px-3 pt-6">
        <div className="mb-3 flex items-center gap-2 px-3 text-[18px] font-medium text-white">
          <CarFront size={20} strokeWidth={1.7} /> Vehicle
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => set({ vehicleTab: t.id })}
            className="relative flex w-full items-center gap-3 rounded-[10px] px-3 py-[11px] text-left text-[14.5px]"
          >
            {tab === t.id && (
              <motion.span
                layoutId="veh-tab"
                className="absolute inset-0 rounded-[10px] bg-white/[0.08]"
                transition={{ type: "spring", stiffness: 460, damping: 38 }}
              />
            )}
            <t.icon size={18} strokeWidth={1.6} className={`relative ${tab === t.id ? "text-white" : "text-white/55"}`} />
            <span className={`relative ${tab === t.id ? "text-white" : "text-white/70"}`}>{t.label}</span>
          </button>
        ))}
      </nav>
      <div className="relative min-w-0 flex-1 overflow-y-auto px-9 pt-7 pb-8 [scrollbar-width:none]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="max-w-[640px]"
          >
            <h2 className="mb-2 text-[22px] font-medium text-white">{TABS.find((t) => t.id === tab)?.label}</h2>
            {tab === "modes" && <ModesTab />}
            {tab === "chassis" && <ChassisTab />}
            {tab === "engine" && <EngineTab />}
            {tab === "climate" && <ClimateTab />}
            {tab === "lights" && <LightsTab />}
            {tab === "assist" && <AssistTab />}
            {tab === "doors" && <DoorsTab />}
            {tab === "trip" && <TripTab />}
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

function ChassisTab() {
  const s = useCar();
  return (
    <>
      <SectionTitle>Ride height</SectionTitle>
      <div className="py-2">
        <Segmented
          id="rh"
          value={s.rideHeight}
          onChange={(v) => s.set({ rideHeight: v })}
          options={[
            { value: "low", label: "Low" },
            { value: "normal", label: "Normal" },
            { value: "high", label: "High" },
          ]}
        />
      </div>
      <SectionTitle>Damping (PASM)</SectionTitle>
      <div className="py-2">
        <Segmented
          id="pasm"
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
        right={<Toggle on={s.lift} onChange={() => s.set({ lift: !s.lift, rideHeight: !s.lift ? "high" : "normal" })} />}
      />
    </>
  );
}

function EngineTab() {
  const s = useCar();
  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Tile label="Engine speed" value={`${(Math.round(s.rpm / 50) * 50).toLocaleString("en")} rpm`} />
        <Tile label="Oil temperature" value={`${Math.round(s.oilTemp)} °C`} />
        <Tile label="Coolant" value={`${Math.round(s.coolantTemp)} °C`} />
        <Tile label="Oil pressure" value={`${(1.2 + (s.rpm / REDLINE) * 4.3).toFixed(1)} bar`} />
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
  const s = useCar();
  return (
    <>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <ClimateKey icon={Snowflake} label="A/C MAX" on={s.acMax} onClick={() => s.set({ acMax: !s.acMax })} />
        <ClimateKey icon={Fan} label="AUTO" on={s.auto} onClick={() => s.set({ auto: !s.auto })} />
        <ClimateKey icon={Wind} label="Defrost" on={s.defrost} onClick={() => s.set({ defrost: !s.defrost })} />
        <ClimateKey icon={Snowflake} label="SYNC" on={s.sync} onClick={() => s.set({ sync: !s.sync, tempR: s.tempL })} />
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
          id="vent"
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
  const s = useCar();
  return (
    <>
      <SectionTitle>Headlights</SectionTitle>
      <div className="py-2">
        <Segmented
          id="hl"
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
  const s = useCar();
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
  const s = useCar();
  return (
    <>
      <Row title="Central locking" sub={s.locked ? "Locked" : "Unlocked"} right={<Toggle on={s.locked} onChange={() => s.set({ locked: !s.locked, ...(!s.locked ? { frunkOpen: false, trunkOpen: false, doorL: false, doorR: false } : {}) })} />} />
      <Row title="Front trunk" sub={s.frunkOpen ? "Open" : "Closed"} right={<Toggle on={s.frunkOpen} onChange={() => s.set({ frunkOpen: !s.frunkOpen, ...(!s.frunkOpen ? { locked: false } : {}) })} />} />
      <Row title="Engine lid" sub={s.trunkOpen ? "Open" : "Closed"} right={<Toggle on={s.trunkOpen} onChange={() => s.set({ trunkOpen: !s.trunkOpen, ...(!s.trunkOpen ? { locked: false } : {}) })} />} />
      <Row title="Driver door" sub={s.doorL ? "Open" : "Closed"} right={<Toggle on={s.doorL} onChange={() => s.set({ doorL: !s.doorL, ...(!s.doorL ? { locked: false } : {}) })} />} />
      <Row title="Passenger door" sub={s.doorR ? "Open" : "Closed"} right={<Toggle on={s.doorR} onChange={() => s.set({ doorR: !s.doorR, ...(!s.doorR ? { locked: false } : {}) })} />} />
      <Row title="Comfort access" sub="Unlock when you approach with the key" right={<Toggle on onChange={() => {}} />} />
    </>
  );
}

function TripTab() {
  const s = useCar();
  const km = s.routeD / 1000;
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <div className="text-[12px] text-white/45">{label}</div>
      <div className="mt-1.5 text-[22px] font-light text-white tabular-nums">{value}</div>
    </div>
  );
}

/* ---------------- Media ---------------- */

function MediaSheet() {
  const s = useCar();
  const t = TRACKS[s.track];
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
            className="group relative mt-8 h-5 cursor-pointer"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              s.set({ progress: ((e.clientX - r.left) / r.width) * t.length });
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-white/15" />
            <div className="absolute top-1/2 left-0 h-[4px] -translate-y-1/2 rounded-full bg-white" style={{ width: `${(s.progress / t.length) * 100}%` }} />
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
  { n: "Alex Carter", sub: "Mobile", c: "#ff8a5c" },
  { n: "Sam Becker", sub: "Mobile · Missed 10:12", c: "#39a6ff" },
  { n: "Office", sub: "Work", c: "#3fd46b" },
  { n: "Porsche Zentrum", sub: "Service", c: "#d4b88c" },
  { n: "Jordan Lee", sub: "Mobile", c: "#a57bff" },
];

function PhoneSheet() {
  return (
    <div className="flex h-full">
      <div className="w-[270px] shrink-0 border-r border-white/[0.06] px-3 pt-6">
        <div className="mb-3 flex items-center gap-2 px-3 text-[18px] font-medium text-white">
          <Glyph id="phone" size={20} /> Phone
        </div>
        {["Favourites", "Recent calls", "Contacts", "Keypad", "Messages"].map((l, i) => (
          <div key={l} className={`rounded-[10px] px-3 py-[11px] text-[14.5px] ${i === 1 ? "bg-white/[0.08] text-white" : "text-white/70"}`}>
            {l}
          </div>
        ))}
      </div>
      <div className="flex-1 px-9 pt-7">
        <h2 className="mb-3 text-[22px] font-medium text-white">Recent calls</h2>
        {CONTACTS.map((c) => (
          <Row
            key={c.n}
            title={c.n}
            sub={c.sub}
            right={
              <button className="grid h-10 w-10 place-items-center rounded-full bg-[#3fd46b]/15 text-[#3fd46b] transition hover:bg-[#3fd46b]/25" aria-label={`Call ${c.n}`}>
                <Phone size={17} fill="currentColor" strokeWidth={0} />
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

