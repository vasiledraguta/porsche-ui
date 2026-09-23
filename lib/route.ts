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

/** Position + heading at `d` metres along the route. */
export function positionAt(d: number): { pos: [number, number]; heading: number; index: number } {
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
  // look a little ahead for a calmer heading
  let j = hi;
  while (j < CUM.length - 1 && CUM[j] - dd < 25) j++;
  return {
    pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    heading: bearing(a, ROUTE.coords[j]),
    index: lo,
  };
}

/** Next manoeuvre ahead of `d`. */
export function nextStep(d: number) {
  const s = ROUTE.steps.find((st) => st.at > d + 3 && st.type !== "exit rotary");
  if (!s) return { step: null as Step | null, dist: ROUTE_LEN - d };
  return { step: s, dist: s.at - d };
}

export function fmtDist(m: number) {
  if (m >= 1000) return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km`;
  if (m >= 100) return `${Math.round(m / 10) * 10} m`;
  return `${Math.max(0, Math.round(m / 5) * 5)} m`;
}

export const STOPS = [640, 2330, 4180, 6420, 8050];
