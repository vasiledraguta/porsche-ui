"use client";

import { create } from "zustand";
import { ROUTE_LEN, STOPS, nextStep } from "./route";

export type DriveMode = "wet" | "normal" | "sport" | "track";
export type PartId = "hood" | "trunk" | "doorL" | "doorR";
export const PAINTS = {
  silver: { label: "GT Silver Metallic", color: "#b4b8bc" },
  white: { label: "White", color: "#f4f3ef" },
  carrara: { label: "Carrara White Metallic", color: "#dedfdd" },
  ice: { label: "Ice Grey Metallic", color: "#c6cccf" },
  grey: { label: "Arctic Grey", color: "#8b9294" },
  crayon: { label: "Crayon", color: "#b8b5ad" },
  agate: { label: "Agate Grey Metallic", color: "#55585a" },
  black: { label: "Black", color: "#101215" },
  jetBlack: { label: "Jet Black Metallic", color: "#252a2e" },
  red: { label: "Guards Red", color: "#c9202b" },
  orange: { label: "Lava Orange", color: "#ec541a" },
  yellow: { label: "Racing Yellow", color: "#f4ca15" },
  green: { label: "Python Green", color: "#54b331" },
  blue: { label: "Shark Blue", color: "#1878c6" },
  gentian: { label: "Gentian Blue Metallic", color: "#173a6c" },
} as const;
export type Paint = keyof typeof PAINTS;
export const PAINT_ORDER = Object.keys(PAINTS) as Paint[];
export type Sheet = null | "home" | "vehicle" | "chrono" | "media" | "phone" | "notifications" | "carplay" | "androidauto" | "devices" | "settings";
export type VehicleTab =
  | "modes"
  | "appearance"
  | "chassis"
  | "setup"
  | "engine"
  | "lights"
  | "assist"
  | "climate"
  | "doors"
  | "trip"
  | "trackscreen";

/**
 * 911 GT3 RS (992) drive modes. 4.0 L naturally aspirated flat-six, 386 kW / 525 PS at 8,500 rpm,
 * 9,000 rpm limiter, 7-speed PDK. `minRpm` is where PDK upshifts when cruising.
 */
export const MODES: Record<DriveMode, { label: string; desc: string; spec: string; maxKw: number; response: number; minRpm: number }> = {
  wet: { label: "Wet", desc: "Softer throttle and early PSM intervention for standing water.", spec: "PSM on · PASM Normal", maxKw: 386, response: 0.6, minRpm: 1700 },
  normal: { label: "Normal", desc: "Road setup. Early upshifts, calmer exhaust.", spec: "PSM on · PASM Normal", maxKw: 386, response: 0.85, minRpm: 2000 },
  sport: { label: "Sport", desc: "Sharper throttle, later shifts, exhaust valves open.", spec: "PSM Sport · PASM Sport", maxKw: 386, response: 1, minRpm: 3600 },
  track: { label: "Track", desc: "Full attack. Holds gears near the limiter.", spec: "PSM off · PASM Track", maxKw: 386, response: 1.12, minRpm: 5200 },
};
export const MODE_ORDER: DriveMode[] = ["wet", "normal", "sport", "track"];

/** PDK road speed at the 9,000 rpm limiter, per gear (km/h). */
const GEAR_TOP = [0, 71, 108, 145, 182, 222, 261, 296];
export const REDLINE = 9000;
export const IDLE_RPM = 950;
export const TANK_L = 64;
/** L/100 km by mode, anchored on the 13.4 L WLTP figure. */
const CONS: Record<DriveMode, number> = { wet: 12.8, normal: 13.4, sport: 15.2, track: 19 };
const TYRE_LOAD: Record<DriveMode, number> = { wet: 0.8, normal: 1, sport: 1.15, track: 1.35 };
export const TYRES = ["Front left", "Front right", "Rear left", "Rear right"] as const;
const TYRE_COLD_BAR = [2.2, 2.2, 2.4, 2.4];

export const TRACKS = [
  { title: "Nightcall", artist: "Kavinsky", album: "OutRun", length: 258, hue: 262 },
  { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", length: 243, hue: 214 },
  { title: "Instant Crush", artist: "Daft Punk", album: "Random Access Memories", length: 337, hue: 36 },
  { title: "Resonance", artist: "HOME", album: "Odyssey", length: 212, hue: 190 },
  { title: "Tenebre Rosso Sangue", artist: "Ultimo", album: "Peter Pan", length: 212, hue: 352 },
];

export const AMBIENT = ["#e8eef5", "#3ea0ff", "#2fd3c0", "#ffb35c", "#ff4f64", "#a57bff"];

type State = {
  speed: number;
  powerKw: number;
  rpm: number;
  pdkGear: number;
  fuel: number;
  oilTemp: number;
  coolantTemp: number;
  tyreTemp: number[];
  odo: number;
  routeD: number;
  tripD: number;
  holdUntil: number;
  stopIdx: number;
  tripTime: number;
  tripFuelL: number;
  gear: "P" | "N" | "D";
  mode: DriveMode;
  paint: Paint;
  throttle: number;
  brake: number;
  autopilot: boolean;

  sheet: Sheet;
  vehicleTab: VehicleTab;
  modePopupAt: number;
  shortcuts: boolean;
  map3d: boolean;
  follow: boolean;
  zoomBias: number;

  track: number;
  playing: boolean;
  progress: number;
  volume: number;
  lastVolume: number;
  liked: number[];

  chronoRunning: boolean;
  chronoAt: number;
  chronoBase: number;
  laps: number[];

  tempL: number;
  tempR: number;
  sync: boolean;
  fan: number;
  auto: boolean;
  acMax: boolean;
  defrost: boolean;
  seatL: number;
  seatR: number;
  ventFocus: "driver" | "diffuse" | "passenger";
  rearDefrost: boolean;
  exhaust: boolean;
  drs: boolean;
  startStop: boolean;
  fuelFlap: boolean;
  frunkOpen: boolean;
  trunkOpen: boolean;
  doorL: boolean;
  doorR: boolean;
  carViewReset: number;
  locked: boolean;
  comfortAccess: boolean;
  lift: boolean;
  pasm: "comfort" | "sport";
  reboundF: number;
  compressionF: number;
  reboundR: number;
  compressionR: number;
  diffCoast: number;
  diffDrive: number;
  tc: number;
  esc: "on" | "sport" | "off";
  headlights: "auto" | "low" | "high" | "off";
  ambient: number;
  ambientLevel: number;
  lane: boolean;
  innodrive: boolean;
  signs: boolean;
  parkAssist: boolean;
  notesRead: boolean;
  bluetooth: boolean;
  hotspot: boolean;

  now: number;
};

type Actions = {
  set: (p: Partial<State>) => void;
  toggleLock: () => void;
  togglePart: (id: PartId) => void;
  setGear: (gear: State["gear"]) => void;
  setVolume: (volume: number) => void;
  setMode: (m: DriveMode) => void;
  cycleMode: (dir: 1 | -1) => void;
  nextTrack: (dir: 1 | -1) => void;
  openSheet: (s: Sheet, tab?: VehicleTab) => void;
  toggleChrono: () => void;
  lapChrono: () => void;
  tick: (dt: number, t: number) => void;
};

export const useCar = create<State & Actions>((set, get) => ({
  speed: 0,
  powerKw: 0,
  rpm: IDLE_RPM,
  pdkGear: 1,
  fuel: 72,
  oilTemp: 88,
  coolantTemp: 86,
  tyreTemp: [22, 22, 22, 22],
  odo: 12846,
  routeD: 0,
  tripD: 0,
  holdUntil: 0,
  stopIdx: 0,
  tripTime: 0,
  tripFuelL: 0,
  gear: "P",
  mode: "normal",
  paint: "silver",
  throttle: 0,
  brake: 0,
  autopilot: true,

  sheet: null,
  vehicleTab: "modes",
  modePopupAt: -1e9,
  shortcuts: false,
  map3d: true,
  follow: true,
  zoomBias: 0,

  track: 0,
  playing: true,
  progress: 71,
  volume: 38,
  lastVolume: 38,
  liked: [0],

  chronoRunning: false,
  chronoAt: 0,
  chronoBase: 0,
  laps: [],

  tempL: 21.5,
  tempR: 21.5,
  sync: false,
  fan: 3,
  auto: true,
  acMax: false,
  defrost: false,
  seatL: 1,
  seatR: 0,
  ventFocus: "diffuse",
  rearDefrost: false,
  exhaust: false,
  drs: false,
  startStop: true,
  fuelFlap: false,
  frunkOpen: false,
  trunkOpen: false,
  doorL: false,
  doorR: false,
  carViewReset: 0,
  locked: true,
  comfortAccess: true,
  lift: false,
  pasm: "comfort",
  reboundF: 0,
  compressionF: 0,
  reboundR: 0,
  compressionR: 0,
  diffCoast: 3,
  diffDrive: 3,
  tc: 5,
  esc: "on",
  headlights: "auto",
  ambient: 1,
  ambientLevel: 70,
  lane: true,
  innodrive: true,
  signs: true,
  parkAssist: false,
  notesRead: false,
  bluetooth: true,
  hotspot: false,

  now: 0,

  set: (p) => set(p),
  toggleLock: () =>
    set((s) => ({
      locked: !s.locked,
      ...(!s.locked ? { frunkOpen: false, trunkOpen: false, doorL: false, doorR: false } : {}),
    })),
  togglePart: (id) =>
    set((s) => {
      const key = id === "hood" ? "frunkOpen" : id === "trunk" ? "trunkOpen" : id;
      const open = !s[key];
      return { [key]: open, ...(open ? { locked: false } : {}) };
    }),
  setGear: (gear) =>
    set(gear === "D" ? { gear, locked: true, frunkOpen: false, trunkOpen: false, doorL: false, doorR: false } : { gear }),
  setVolume: (volume) => set((s) => ({ volume, lastVolume: volume > 0 ? volume : s.lastVolume })),
  setMode: (mode) =>
    set((s) => ({
      mode,
      modePopupAt: s.now,
      pasm: mode === "sport" || mode === "track" ? "sport" : "comfort",
      exhaust: mode === "sport" || mode === "track" ? true : mode === "wet" ? false : s.exhaust,
    })),
  cycleMode: (dir) => {
    const i = MODE_ORDER.indexOf(get().mode);
    get().setMode(MODE_ORDER[Math.min(MODE_ORDER.length - 1, Math.max(0, i + dir))]);
  },
  nextTrack: (dir) => set((s) => ({ track: (s.track + dir + TRACKS.length) % TRACKS.length, progress: 0, playing: true })),
  openSheet: (sheet, tab) =>
    set((s) => ({
      sheet: s.sheet === sheet && !tab ? null : sheet,
      vehicleTab: tab ?? s.vehicleTab,
      notesRead: s.notesRead || sheet === "notifications",
    })),
  toggleChrono: () =>
    set((s) => (s.chronoRunning ? { chronoRunning: false, chronoBase: s.chronoBase + s.now - s.chronoAt } : { chronoRunning: true, chronoAt: s.now })),
  lapChrono: () => set((s) => (s.chronoRunning ? { laps: [...s.laps, s.chronoBase + s.now - s.chronoAt] } : { chronoBase: 0, laps: [] })),

  tick: (dt, t) => {
    const s = get();
    const m = MODES[s.mode];
    let throttle = s.throttle;
    let brake = s.brake;
    let { holdUntil, stopIdx, routeD } = s;

    if (s.autopilot && s.gear === "D" && s.throttle === 0 && s.brake === 0) {
      // Cruise the route at believable city speeds: slow for turns, stop at lights.
      const { step, dist } = nextStep(routeD);
      let target = 50;
      if (step && dist < 90) target = step.type === "rotary" || step.type === "roundabout" ? 22 : step.mod?.includes("slight") ? 40 : 24;
      const stop = STOPS[stopIdx];
      if (stop !== undefined && stop - routeD < 70 && stop - routeD > -5) {
        target = Math.max(0, ((stop - routeD) / 70) * 40);
        if (s.speed < 1 && holdUntil === 0) holdUntil = t + 4200;
      }
      if (holdUntil && t < holdUntil) target = 0;
      if (holdUntil && t >= holdUntil) {
        holdUntil = 0;
        stopIdx++;
      }
      if (ROUTE_LEN - routeD < 60) target = Math.max(0, ((ROUTE_LEN - routeD) / 60) * 25);

      const err = target - s.speed;
      if (err > 0) throttle = Math.min(0.55, err / 30);
      else brake = Math.min(0.8, -err / 25);
    }

    // 1,450 kg, big wing (high drag), traction-limited launch around 3.2 s to 100 km/h
    const v = s.speed / 3.6;
    const mass = 1450;
    const maxForce = 12600 * m.response;
    const drivePower = throttle * m.maxKw * 1000;
    const driveForce = s.gear === "D" ? Math.min(maxForce * throttle, v > 1 ? drivePower / v : maxForce * throttle) : 0;
    const drag = 0.5 * 1.2 * 0.39 * 2.05 * v * v + 160;
    const engineBrake = v > 0.3 && throttle === 0 ? 450 : 0;
    const brakeForce = v > 0.3 ? brake * 14000 + engineBrake : 0;
    const accel = (driveForce - drag - brakeForce) / mass;
    let nv = Math.max(0, v + accel * dt);
    if (nv < 0.2 && throttle === 0) nv = 0;
    const kmh = nv * 3.6;

    // PDK: highest gear that keeps revs above the mode's shift floor (higher under load)
    let gearN = 1;
    if (s.gear === "D") {
      const floor = m.minRpm + throttle * 2600;
      for (let g = 7; g >= 1; g--) {
        if ((kmh / GEAR_TOP[g]) * REDLINE >= floor || g === 1) {
          gearN = g;
          break;
        }
      }
      // one gear at a time on the way up
      gearN = Math.min(gearN, s.pdkGear + 1);
    }
    const wheelRpm = s.gear === "D" ? (kmh / GEAR_TOP[gearN]) * REDLINE : 0;
    const launch = IDLE_RPM + throttle * (s.gear === "D" ? 2400 : 6000);
    const targetRpm = Math.min(REDLINE, Math.max(wheelRpm, kmh < 12 ? launch : IDLE_RPM));
    const engineStopped = s.startStop && s.gear === "D" && kmh === 0 && throttle === 0;
    const rpm = engineStopped ? 0 : s.rpm === 0 ? IDLE_RPM : s.rpm + (targetRpm - s.rpm) * Math.min(1, dt * (targetRpm > s.rpm ? 9 : 6));

    const powerKw = nv > 0.3 ? Math.max(0, driveForce * nv) / 1000 : 0;
    // ~0.33 L per kWh at the crank, plus idle burn
    const litres = engineStopped ? 0 : (powerKw * 0.33 * dt) / 3600 + ((0.8 + rpm / 9000) * dt) / 3600;
    const fuel = Math.min(100, Math.max(6, s.fuel - (litres / TANK_L) * 100));
    const warm = (x: number, target: number) => x + (target - x) * Math.min(1, dt * 0.02);
    const tyreTemp = s.tyreTemp.map((x, i) => {
      const front = i < 2;
      const target = 22 + s.speed * 0.45 * TYRE_LOAD[s.mode] + (front ? brake * 30 : throttle * 24) + (i % 2 ? 1.5 : 0);
      return x + (target - x) * Math.min(1, dt * 0.05);
    });
    const progress = s.playing ? s.progress + dt : s.progress;
    const trackEnded = s.playing && progress >= TRACKS[s.track].length;

    routeD += nv * dt;
    if (routeD >= ROUTE_LEN - 2 && nv < 0.5) {
      // arrived: start the trip again
      routeD = 0;
      stopIdx = 0;
      holdUntil = 0;
    }

    set({
      now: t,
      speed: nv * 3.6,
      powerKw: s.powerKw + (powerKw - s.powerKw) * Math.min(1, dt * 6),
      rpm,
      pdkGear: gearN,
      fuel,
      oilTemp: warm(s.oilTemp, 96 + (rpm / REDLINE) * 18),
      coolantTemp: warm(s.coolantTemp, 88 + (rpm / REDLINE) * 8),
      tyreTemp,
      odo: s.odo + (nv * dt) / 1000,
      routeD,
      tripD: s.tripD + nv * dt,
      holdUntil,
      stopIdx,
      tripTime: s.tripTime + (nv > 0 ? dt : 0),
      tripFuelL: s.tripFuelL + litres,
      track: trackEnded ? (s.track + 1) % TRACKS.length : s.track,
      progress: trackEnded ? progress - TRACKS[s.track].length : progress,
    });
  },
}));

/** Remaining range in km from fuel level (%) at the mode's typical consumption. */
export const rangeFor = (fuelPct: number, mode: DriveMode) => Math.round(((fuelPct / 100) * TANK_L * 100) / CONS[mode]);

export const fuelPercentForDistance = (distanceKm: number, mode: DriveMode) => (distanceKm * CONS[mode]) / TANK_L;

export const oilBar = (rpm: number) => 1.2 + (rpm / REDLINE) * 4.3;

export const tyreBar = (i: number, temp: number) => (TYRE_COLD_BAR[i] * (temp + 273)) / 293;

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
