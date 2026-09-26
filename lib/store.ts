"use client";

import { create } from "zustand";
import { ROUTE_LEN, STOPS, nextStep } from "./route";

export type DriveMode = "wet" | "normal" | "sport" | "track";
export type Sheet = null | "home" | "vehicle" | "media" | "phone";
export type VehicleTab =
  | "modes"
  | "chassis"
  | "engine"
  | "lights"
  | "assist"
  | "climate"
  | "doors"
  | "trip";

/**
 * 911 GT3 RS (992) drive modes. 4.0 L naturally aspirated flat-six, 386 kW / 525 PS at 8,500 rpm,
 * 9,000 rpm limiter, 7-speed PDK. `minRpm` is where PDK upshifts when cruising.
 */
export const MODES: Record<DriveMode, { label: string; desc: string; spec: string; maxKw: number; response: number; minRpm: number }> = {
  wet: { label: "Wet", desc: "Softer throttle and early PSM intervention for standing water.", spec: "PSM on · PASM Normal", maxKw: 386, response: 0.6, minRpm: 1700 },
  normal: { label: "Normal", desc: "Road setup. Early upshifts, calmer exhaust.", spec: "PSM on · PASM Normal", maxKw: 386, response: 0.85, minRpm: 2000 },
  sport: { label: "Sport", desc: "Sharper throttle, later shifts, exhaust valves open.", spec: "PSM Sport · PASM Sport", maxKw: 386, response: 1, minRpm: 3600 },
  track: { label: "Track", desc: "Full attack. Holds gears near the limiter, lowest ride height.", spec: "PSM off · PASM Track", maxKw: 386, response: 1.12, minRpm: 5200 },
};
export const MODE_ORDER: DriveMode[] = ["wet", "normal", "sport", "track"];

/** PDK road speed at the 9,000 rpm limiter, per gear (km/h). */
const GEAR_TOP = [0, 71, 108, 145, 182, 222, 261, 296];
export const REDLINE = 9000;
export const IDLE_RPM = 950;
export const TANK_L = 64;
/** L/100 km by mode, anchored on the 13.4 L WLTP figure. */
const CONS: Record<DriveMode, number> = { wet: 12.8, normal: 13.4, sport: 15.2, track: 19 };

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
  odo: number;
  routeD: number;
  tripD: number;
  holdUntil: number;
  stopIdx: number;
  tripTime: number;
  tripFuelL: number;
  gear: "P" | "R" | "N" | "D";
  mode: DriveMode;
  throttle: number;
  brake: number;
  autopilot: boolean;
  heading: number;

  sheet: Sheet;
  vehicleTab: VehicleTab;
  modePopupAt: number;
  map3d: boolean;
  follow: boolean;
  zoomBias: number;

  track: number;
  playing: boolean;
  progress: number;
  volume: number;
  liked: number[];

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
  startStop: boolean;
  fuelFlap: boolean;
  frunkOpen: boolean;
  trunkOpen: boolean;
  doorL: boolean;
  doorR: boolean;
  carViewReset: number;
  locked: boolean;
  lift: boolean;
  rideHeight: "low" | "normal" | "high";
  pasm: "comfort" | "sport";
  headlights: "auto" | "low" | "high" | "off";
  ambient: number;
  ambientLevel: number;
  lane: boolean;
  innodrive: boolean;
  signs: boolean;
  parkAssist: boolean;

  now: number;
  bootT: number;
};

type Actions = {
  set: (p: Partial<State>) => void;
  setMode: (m: DriveMode) => void;
  cycleMode: (dir: 1 | -1) => void;
  nextTrack: (dir: 1 | -1) => void;
  openSheet: (s: Sheet, tab?: VehicleTab) => void;
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
  odo: 12846,
  routeD: 0,
  tripD: 0,
  holdUntil: 0,
  stopIdx: 0,
  tripTime: 0,
  tripFuelL: 0,
  gear: "D",
  mode: "normal",
  throttle: 0,
  brake: 0,
  autopilot: true,
  heading: 0,

  sheet: null,
  vehicleTab: "modes",
  modePopupAt: -1e9,
  map3d: true,
  follow: true,
  zoomBias: 0,

  track: 0,
  playing: true,
  progress: 71,
  volume: 38,
  liked: [0],

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
  startStop: true,
  fuelFlap: false,
  frunkOpen: false,
  trunkOpen: false,
  doorL: false,
  doorR: false,
  carViewReset: 0,
  locked: true,
  lift: false,
  rideHeight: "normal",
  pasm: "comfort",
  headlights: "auto",
  ambient: 1,
  ambientLevel: 70,
  lane: true,
  innodrive: true,
  signs: true,
  parkAssist: false,

  now: 0,
  bootT: 0,

  set: (p) => set(p),
  setMode: (mode) =>
    set((s) => ({
      mode,
      modePopupAt: s.now,
      rideHeight: mode === "track" ? "low" : s.rideHeight === "low" ? "normal" : s.rideHeight,
      pasm: mode === "sport" || mode === "track" ? "sport" : "comfort",
      exhaust: mode === "sport" || mode === "track" ? true : mode === "wet" ? false : s.exhaust,
    })),
  cycleMode: (dir) => {
    const i = MODE_ORDER.indexOf(get().mode);
    get().setMode(MODE_ORDER[Math.min(MODE_ORDER.length - 1, Math.max(0, i + dir))]);
  },
  nextTrack: (dir) => set((s) => ({ track: (s.track + dir + TRACKS.length) % TRACKS.length, progress: 0, playing: true })),
  openSheet: (sheet, tab) => set((s) => ({ sheet: s.sheet === sheet && !tab ? null : sheet, vehicleTab: tab ?? s.vehicleTab })),

  tick: (dt, t) => {
    const s = get();
    const m = MODES[s.mode];
    let throttle = s.throttle;
    let brake = s.brake;
    let { holdUntil, stopIdx, routeD } = s;

    if (s.autopilot && s.throttle === 0 && s.brake === 0) {
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
    const driveForce = Math.min(maxForce * throttle, v > 1 ? drivePower / v : maxForce * throttle);
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
    const rpm = s.rpm + (targetRpm - s.rpm) * Math.min(1, dt * (targetRpm > s.rpm ? 9 : 6));

    const powerKw = nv > 0.3 ? Math.max(0, driveForce * nv) / 1000 : 0;
    // ~0.33 L per kWh at the crank, plus idle burn
    const litres = (powerKw * 0.33 * dt) / 3600 + ((0.8 + rpm / 9000) * dt) / 3600;
    const fuel = Math.min(100, Math.max(6, s.fuel - (litres / TANK_L) * 100));
    const warm = (x: number, target: number) => x + (target - x) * Math.min(1, dt * 0.02);

    routeD += nv * dt;
    if (routeD >= ROUTE_LEN - 2 && nv < 0.5) {
      // arrived: start the trip again
      routeD = 0;
      stopIdx = 0;
      holdUntil = 0;
    }

    set({
      now: t,
      bootT: s.bootT + dt,
      speed: nv * 3.6,
      powerKw: s.powerKw + (powerKw - s.powerKw) * Math.min(1, dt * 6),
      rpm,
      pdkGear: gearN,
      fuel,
      oilTemp: warm(s.oilTemp, 96 + (rpm / REDLINE) * 18),
      coolantTemp: warm(s.coolantTemp, 88 + (rpm / REDLINE) * 8),
      odo: s.odo + (nv * dt) / 1000,
      routeD,
      tripD: s.tripD + nv * dt,
      holdUntil,
      stopIdx,
      tripTime: s.tripTime + (nv > 0 ? dt : 0),
      tripFuelL: s.tripFuelL + litres,
      progress: s.playing ? (s.progress + dt) % TRACKS[s.track].length : s.progress,
    });
  },
}));

/** Remaining range in km from fuel level (%) at the mode's typical consumption. */
export const rangeFor = (fuelPct: number, mode: DriveMode) => Math.round(((fuelPct / 100) * TANK_L * 100) / CONS[mode]);

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
