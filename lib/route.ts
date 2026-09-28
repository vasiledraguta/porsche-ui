import raw from "./route.json";

export type Step = { at: number; type: string; mod?: string | null; name: string; loc: [number, number] };

export const ROUTE = raw as unknown as {
  from: string;
  fromSub: string;
  to: string;
  toSub: string;
  distance: number;
  duration: number;
  coords: [number, number][];
  steps: Step[];
};

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

function hav(a: [number, number], b: [number, number]) {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function bearing(a: [number, number], b: [number, number]) {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x =
    Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const CUM: number[] = [0];
for (let i = 1; i < ROUTE.coords.length; i++) CUM.push(CUM[i - 1] + hav(ROUTE.coords[i - 1], ROUTE.coords[i]));
export const ROUTE_LEN = CUM[CUM.length - 1];

/** Segment index and interpolated point at `d` metres along the route. */
function pointAt(d: number): { pos: [number, number]; index: number } {
  const dd = Math.max(0, Math.min(ROUTE_LEN - 0.01, d));
  let lo = 0;
  let hi = CUM.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUM[mid] <= dd) lo = mid;
    else hi = mid;
  }
  const a = ROUTE.coords[lo];
  const b = ROUTE.coords[hi];
  const t = (dd - CUM[lo]) / Math.max(0.001, CUM[hi] - CUM[lo]);
  return { pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], index: lo };
}

/** Half-length of the chord used for heading: the arrow only starts turning this close to a corner. */
const TURN_M = 5;

/**
 * Position + heading at `d` metres along the route. Heading is the chord between the points
 * TURN_M behind and ahead on the path itself, so the arrow follows the road and swings round
 * a corner only in the last few metres, instead of aiming at a point past the bend.
 */
export function positionAt(d: number): { pos: [number, number]; heading: number; index: number } {
  const here = pointAt(d);
  const from = pointAt(Math.max(0, d - TURN_M)).pos;
  const ahead = pointAt(Math.min(ROUTE_LEN - 0.01, Math.max(d, TURN_M) + TURN_M)).pos;
  return { pos: here.pos, heading: bearing(from, ahead), index: here.index };
}

/** Next manoeuvre ahead of `d`. */
export function nextStep(d: number) {
  const s = ROUTE.steps.find((st) => st.at > d + 3 && st.type !== "exit rotary" && st.type !== "exit roundabout");
  if (!s) return { step: null as Step | null, dist: ROUTE_LEN - d };
  return { step: s, dist: s.at - d };
}

export type RoadPath = { n: number; x: Float32Array; z: Float32Array; rx: Float32Array; rz: Float32Array };

function blur(a: Float32Array, w: number) {
  const sum = new Float64Array(a.length + 1);
  for (let i = 0; i < a.length; i++) sum[i + 1] = sum[i] + a[i];
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - w);
    const hi = Math.min(a.length - 1, i + w);
    out[i] = (sum[hi + 1] - sum[lo]) / (hi - lo + 1);
  }
  return out;
}

let road: RoadPath | null = null;

export function roadPath(): RoadPath {
  if (road) return road;
  const [lon0, lat0] = ROUTE.coords[0];
  const kx = 111320 * Math.cos(rad(lat0));
  const pts = ROUTE.coords.map(([lon, lat]) => [(lon - lon0) * kx, -(lat - lat0) * 110540]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const n = Math.floor(ROUTE_LEN) + 1;
  const scale = cum[cum.length - 1] / ROUTE_LEN;
  const rx = new Float32Array(n);
  const rz = new Float32Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const d = i * scale;
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    const t = Math.min(1, (d - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]));
    rx[i] = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t;
    rz[i] = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t;
  }
  let x = rx;
  let z = rz;
  for (let p = 0; p < 3; p++) {
    x = blur(x, 16);
    z = blur(z, 16);
  }
  road = { n, x, z, rx, rz };
  return road;
}

export function fmtDist(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km`;
  if (m >= 100) return `${Math.round(m / 10) * 10} m`;
  return `${Math.max(0, Math.round(m / 5) * 5)} m`;
}

/** Traffic lights on the Cluj route (metres along it): Calea Dorobanților, Teodor Mihali, Aurel Vlaicu, Traian Vuia. */
export const STOPS = [1150, 2370, 3620, 5480, 7080];

// Romanian urban default; the airport approach drops to 30
export const speedLimitAt = (d: number) => (d > 7900 ? 30 : 50);

const SPEEDING_MARGIN = 3;

export const isSpeeding = (kmh: number, d: number) => Math.round(kmh) >= speedLimitAt(d) + SPEEDING_MARGIN;
