"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ROUTE, STOPS, roadPath, type RoadPath } from "@/lib/route";
import { useCar } from "@/lib/store";

const LANE = 3.3;
const HALF = LANE * 2;
const WALK = 9.4;
const KERB = 0.12;
const CAR_U = LANE * 1.5;
const CROSS_HALF = 5;
const CROSS_LINE = WALK + 1.2;
const BG = "#0e1013";
const BG_RGB = [14 / 255, 16 / 255, 19 / 255];
const FOG: [number, number] = [30, 72];
const SIGNAL = ["#30d158", "#ffb020", "#ff3b30"];
const CAR_COLORS = ["#8a9098", "#5c626a", "#b8bdc3", "#3b4047", "#1f2328", "#6f7680"];
const PED_COLORS = ["#6b7078", "#4b5058", "#8e949c"];
const GREEN = 0;
const AMBER = 1;
const RED = 2;

type Junction = { d: number; half: number; light: number; at: number; ahead: boolean };
type State = ReturnType<typeof useCar.getState>;
type Pose = { x: number; z: number; tx: number; tz: number };
type Vehicle = { obj: THREE.Group; tail: THREE.MeshBasicMaterial; d: number; v: number; v0: number; u: number; dir: 1 | -1; on: boolean };
type Crosser = { obj: THREE.Group; tail: THREE.MeshBasicMaterial; j: number; p: number; v: number; side: 1 | -1; on: boolean };
type Walker = { obj: THREE.Object3D; d: number; u: number; dir: 1 | -1; along: boolean; speed: number; phase: number; on: boolean };
type Rig = { light: number; lamps: THREE.Mesh[]; halos: THREE.Sprite[] };

const JUNCTIONS: Junction[] = (() => {
  const list: Junction[] = STOPS.map((s, i) => ({ d: s + 11, half: CROSS_HALF, light: i, at: s + 11, ahead: false }));
  for (const t of ROUTE.steps) {
    if ((t.type !== "turn" && t.type !== "end of road") || !/left|right/.test(t.mod ?? "") || t.mod?.includes("slight")) continue;
    const ahead = t.type !== "end of road";
    const near = list.find((j) => Math.abs(j.d - t.at) < 30);
    if (near) Object.assign(near, { at: t.at, ahead });
    else list.push({ d: t.at, half: CROSS_HALF * 2, light: -1, at: t.at, ahead });
  }
  return list.sort((a, b) => a.d - b.d).slice(0, 8);
})();

const GLSL_LIB = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float band(float x, float c, float w, float aa) { return 1.0 - smoothstep(w - aa, w + aa, abs(x - c)); }
float grid(float x, float aa) { return smoothstep(0.5 - aa, 0.5, abs(fract(x) - 0.5)); }
vec3 fogged(vec3 col) {
  return mix(col, uBg, clamp((distance(vW, cameraPosition) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0));
}
`;

const ROAD_VERT = `
attribute vec2 aRoad;
varying vec3 vW;
varying vec2 vR;
varying float vY;
void main() {
  vR = aRoad;
  vY = position.y;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const ROAD_FRAG = `
uniform float uOpacity;
uniform vec3 uBg;
uniform vec2 uFog;
uniform vec4 uJ[8];
varying vec3 vW;
varying vec2 vR;
varying float vY;
${GLSL_LIB}
void main() {
  float u = vR.x;
  float d = vR.y;
  float au = abs(u);
  float aau = fwidth(u);
  float aad = fwidth(d);
  float zone = 0.0;
  float walk = 0.0;
  float stopl = 0.0;
  float solid = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 j = uJ[i];
    float k = d - j.x;
    float ak = abs(k);
    zone = max(zone, 1.0 - step(j.y, ak));
    walk = max(walk, band(ak, j.y + 2.6, 2.0, aad));
    stopl = max(stopl, j.z * (band(k, -(j.y + 5.4), 0.2, aad) * step(0.3, u) + band(k, j.y + 5.4, 0.2, aad) * step(0.3, -u)));
    solid = max(solid, j.z * (1.0 - step(j.y + 30.0, ak)));
  }
  float grain = noise(vec2(u, d) * 0.45) * 0.6 + noise(vec2(u, d) * 2.3) * 0.4;
  vec3 asphalt = vec3(0.092, 0.099, 0.112) * (0.9 + 0.2 * grain);
  float tracks = 0.0;
  for (int i = 0; i < 4; i++) {
    float c = (float(i) - 1.5) * ${LANE.toFixed(2)};
    tracks += band(u, c - 0.78, 0.28, aau) + band(u, c + 0.78, 0.28, aau);
  }
  asphalt *= 1.0 - 0.1 * tracks * (1.0 - zone);
  float dash = band(fract(d / 9.0), 0.5, 0.17, aad / 9.0);
  float lines = band(u, 0.14, 0.055, aau) + band(u, -0.14, 0.055, aau);
  lines += band(au, ${LANE.toFixed(2)}, 0.06, aau) * max(dash, solid);
  lines += band(au, ${(HALF - 0.3).toFixed(2)}, 0.07, aau);
  lines *= (1.0 - zone) * (1.0 - walk);
  float inside = 1.0 - step(${(HALF - 0.4).toFixed(2)}, au);
  float zebra = walk * band(fract(u / 1.1), 0.5, 0.26, aau / 1.1) * inside;
  float paint = clamp(lines + zebra + stopl * inside, 0.0, 1.0) * (0.82 + 0.18 * grain);
  vec3 col = mix(asphalt, vec3(0.74, 0.76, 0.78), paint);
  float side = step(${HALF.toFixed(2)}, au) * (1.0 - zone);
  vec3 pave = vec3(0.128, 0.135, 0.148) * (0.94 + 0.12 * grain);
  pave *= 1.0 - 0.18 * max(grid(d / 1.6, fwidth(d / 1.6) * 1.5 + 0.02), grid((au - ${HALF.toFixed(2)}) / 1.4, fwidth(u / 1.4) * 1.5 + 0.02));
  float top = step(${(KERB - 0.005).toFixed(3)}, vY);
  pave = mix(pave, vec3(0.2, 0.21, 0.225), top * (1.0 - step(${(HALF + 0.22).toFixed(2)}, au)));
  pave = mix(pave, vec3(0.055, 0.06, 0.068), step(0.004, vY) * (1.0 - top) * (1.0 - step(${(HALF + 0.01).toFixed(2)}, au)));
  col = mix(col, pave, side);
  col = mix(col, uBg, smoothstep(${(WALK - 0.8).toFixed(2)}, ${WALK.toFixed(2)}, au) * (1.0 - zone));
  gl_FragColor = vec4(fogged(col), uOpacity);
}
`;

const STUB_FRAG = `
uniform float uOpacity;
uniform vec3 uBg;
uniform vec2 uFog;
varying vec3 vW;
varying vec2 vR;
varying float vY;
${GLSL_LIB}
void main() {
  float u = vR.x;
  float v = abs(vR.y);
  float au = abs(u);
  float aau = fwidth(u);
  float aav = fwidth(v);
  float grain = noise(vR * 0.45) * 0.6 + noise(vR * 2.3) * 0.4;
  vec3 col = vec3(0.092, 0.099, 0.112) * (0.9 + 0.2 * grain);
  float open = step(${(CROSS_LINE + 0.4).toFixed(2)}, v);
  float lines = (band(u, 0.14, 0.055, aau) + band(u, -0.14, 0.055, aau) + band(au, ${(CROSS_HALF - 0.25).toFixed(2)}, 0.07, aau)) * open;
  float inside = 1.0 - step(${(CROSS_HALF - 0.4).toFixed(2)}, au);
  float zebra = band(v, ${(HALF + 2.0).toFixed(2)}, 1.4, aav) * band(fract(u / 1.1), 0.5, 0.26, aau / 1.1) * inside;
  float stopl = band(v, ${CROSS_LINE.toFixed(2)}, 0.2, aav) * inside;
  float paint = clamp(lines + zebra + stopl, 0.0, 1.0) * (0.82 + 0.18 * grain);
  col = mix(col, vec3(0.74, 0.76, 0.78), paint);
  vec3 pave = vec3(0.128, 0.135, 0.148) * (0.94 + 0.12 * grain);
  pave *= 1.0 - 0.18 * max(grid(v / 1.6, aav * 1.5 + 0.02), grid((au - ${CROSS_HALF.toFixed(2)}) / 1.4, aau * 1.5 + 0.02));
  col = mix(col, pave, step(${CROSS_HALF.toFixed(2)}, au));
  col = mix(col, uBg, max(smoothstep(${(CROSS_HALF + 2.2).toFixed(2)}, ${(CROSS_HALF + 3).toFixed(2)}, au), smoothstep(40.0, 58.0, v)));
  gl_FragColor = vec4(fogged(col), uOpacity);
}
`;

const at = (a: Float32Array, d: number) => {
  const c = Math.min(a.length - 1, Math.max(0, d));
  const i = Math.min(a.length - 2, Math.floor(c));
  return a[i] + (a[i + 1] - a[i]) * (c - i);
};

function pose(p: RoadPath, d: number, u: number, o: Pose) {
  const ax = at(p.x, d - 2);
  const az = at(p.z, d - 2);
  const bx = at(p.x, d + 2);
  const bz = at(p.z, d + 2);
  const l = Math.hypot(bx - ax, bz - az) || 1;
  o.tx = (bx - ax) / l;
  o.tz = (bz - az) / l;
  o.x = at(p.x, d) - o.tz * u;
  o.z = at(p.z, d) + o.tx * u;
  return o;
}

function signal(light: number, s: State) {
  if (light < 0 || !s.autopilot || s.gear !== "D" || light !== s.stopIdx) return GREEN;
  if (s.holdUntil) return s.now < s.holdUntil ? RED : GREEN;
  const ahead = STOPS[light] - s.routeD;
  if (ahead > 170 || ahead < -5) return GREEN;
  return ahead > 140 ? AMBER : RED;
}

function idm(v: number, v0: number, gap: number) {
  const s = 2.2 + v * 1.1;
  return Math.max(-9, 2.4 * (1 - (v / v0) ** 4 - (s / Math.max(0.3, gap)) ** 2));
}

function roadMaterial(frag: string) {
  return new THREE.ShaderMaterial({
    vertexShader: ROAD_VERT,
    fragmentShader: frag,
    uniforms: {
      uOpacity: { value: 0 },
      uBg: { value: new THREE.Vector3(...BG_RGB) },
      uFog: { value: new THREE.Vector2(...FOG) },
      uJ: { value: Array.from({ length: 8 }, (_, i) => (JUNCTIONS[i] ? new THREE.Vector4(JUNCTIONS[i].d, JUNCTIONS[i].half, JUNCTIONS[i].light >= 0 ? 1 : 0, 0) : new THREE.Vector4(-1e5, 0, 0, 0))) },
    },
    transparent: true,
    side: THREE.DoubleSide,
  });
}

function ribbon(p: RoadPath) {
  const us = [-WALK, -HALF, -HALF, HALF, HALF, WALK];
  const raised = [1, 1, 0, 0, 1, 1];
  const ds: number[] = [];
  for (let d = 0; d < p.n - 1; d += 2) ds.push(d);
  ds.push(p.n - 1);
  const pos = new Float32Array(ds.length * 18);
  const road = new Float32Array(ds.length * 12);
  const o: Pose = { x: 0, z: 0, tx: 0, tz: 1 };
  ds.forEach((d, i) => {
    const kerb = JUNCTIONS.some((j) => Math.abs(d - j.d) < j.half) ? 0 : KERB;
    for (let k = 0; k < 6; k++) {
      pose(p, d, us[k], o);
      pos.set([o.x, raised[k] * kerb - 0.002, o.z], (i * 6 + k) * 3);
      road.set([us[k], d], (i * 6 + k) * 2);
    }
  });
  const index: number[] = [];
  for (let i = 0; i < ds.length - 1; i++) {
    for (let k = 0; k < 5; k++) {
      const a = i * 6 + k;
      index.push(a, a + 6, a + 1, a + 1, a + 6, a + 7);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aRoad", new THREE.BufferAttribute(road, 2));
  g.setIndex(index);
  return g;
}

function stub(cx: number, cz: number, ax: number, az: number, from: number, to: number) {
  const w = CROSS_HALF + 3;
  const pos: number[] = [];
  const road: number[] = [];
  for (const v of [from, to]) {
    for (const u of [-w, w]) {
      pos.push(cx + ax * v - az * u, -0.02, cz + az * v + ax * u);
      road.push(u, v);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aRoad", new THREE.Float32BufferAttribute(road, 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
}

function carKit() {
  const body = new THREE.Shape();
  body.moveTo(-2.2, 0.32);
  body.lineTo(2.18, 0.32);
  body.quadraticCurveTo(2.3, 0.34, 2.28, 0.55);
  body.lineTo(2.2, 0.72);
  body.quadraticCurveTo(1.9, 0.86, 1.25, 0.9);
  body.lineTo(0.35, 1.36);
  body.quadraticCurveTo(-0.2, 1.42, -0.8, 1.38);
  body.lineTo(-1.75, 1.0);
  body.quadraticCurveTo(-2.15, 0.95, -2.25, 0.8);
  body.lineTo(-2.28, 0.45);
  body.quadraticCurveTo(-2.28, 0.32, -2.2, 0.32);

  const roof = new THREE.Shape();
  roof.moveTo(1.2, 0.92);
  roof.lineTo(1.29, 0.98);
  roof.lineTo(0.39, 1.44);
  roof.quadraticCurveTo(-0.2, 1.51, -0.83, 1.46);
  roof.lineTo(-1.78, 1.08);
  roof.lineTo(-1.55, 0.92);
  roof.lineTo(1.2, 0.92);

  const side = new THREE.Shape();
  side.moveTo(1.1, 0.97);
  side.lineTo(0.36, 1.33);
  side.quadraticCurveTo(-0.2, 1.38, -0.78, 1.35);
  side.lineTo(-1.66, 1.0);
  side.lineTo(1.1, 0.97);

  const extrude = (s: THREE.Shape, depth: number, bevel: boolean) => {
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel, bevelSize: 0.07, bevelThickness: 0.07, bevelSegments: 3, curveSegments: 8 });
    g.translate(0, 0, -depth / 2);
    g.rotateY(-Math.PI / 2);
    return g;
  };

  const wheel = (x: number, z: number) => new THREE.CylinderGeometry(0.34, 0.34, 0.26, 20).rotateZ(Math.PI / 2).translate(x, 0.34, z);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

  return {
    body: extrude(body, 1.66, true),
    glass: mergeGeometries([extrude(roof, 1.5, false), extrude(side, 1.84, false)])!,
    wheels: mergeGeometries([wheel(0.8, 1.38), wheel(-0.8, 1.38), wheel(0.8, -1.4), wheel(-0.8, -1.4)])!,
    head: mergeGeometries([box(0.42, 0.06, 0.05, 0.58, 0.66, 2.36), box(0.42, 0.06, 0.05, -0.58, 0.66, 2.36)])!,
    tail: box(1.55, 0.08, 0.05, 0, 0.72, -2.37),
  };
}

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.22, "rgba(255,255,255,0.5)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildWorld() {
  const path = roadPath();
  const root = new THREE.Group();
  const fade: THREE.Material[] = [];
  const track = <M extends THREE.Material>(m: M) => {
    m.transparent = true;
    fade.push(m);
    return m;
  };
  const rand = seeded(911);
  const o: Pose = { x: 0, z: 0, tx: 0, tz: 1 };

  const roadMat = roadMaterial(ROAD_FRAG);
  const stubMat = roadMaterial(STUB_FRAG);
  const main = new THREE.Mesh(ribbon(path), roadMat);
  main.renderOrder = -2;
  main.frustumCulled = false;
  root.add(main);

  const geo = JUNCTIONS.map((j) => {
    const a = Math.max(0, Math.round(j.at - 40));
    const b = Math.max(a + 1, Math.round(j.at - 12));
    const l = Math.hypot(path.rx[b] - path.rx[a], path.rz[b] - path.rz[a]) || 1;
    const dx = (path.rx[b] - path.rx[a]) / l;
    const dz = (path.rz[b] - path.rz[a]) / l;
    const cx = at(path.rx, j.at);
    const cz = at(path.rz, j.at);
    const stubs = [stub(cx, cz, -dz, dx, -60, 60)];
    if (j.ahead) stubs.push(stub(cx, cz, dx, dz, 0, 60));
    for (const g of stubs) {
      const m = new THREE.Mesh(g, stubMat);
      m.renderOrder = -3;
      root.add(m);
    }
    return { cx, cz, dx, dz };
  });

  const kit = carKit();
  const bodyMats = CAR_COLORS.map((c) => track(new THREE.MeshStandardMaterial({ color: c, metalness: 0.35, roughness: 0.42 })));
  const glassMat = track(new THREE.MeshStandardMaterial({ color: "#07090b", metalness: 0.6, roughness: 0.12 }));
  const tyreMat = track(new THREE.MeshStandardMaterial({ color: "#0b0c0e", roughness: 0.9 }));
  const headMat = track(new THREE.MeshBasicMaterial({ color: "#e9eef5", toneMapped: false }));
  const makeCar = () => {
    const obj = new THREE.Group();
    const tail = track(new THREE.MeshBasicMaterial({ color: "#5a0f0c", toneMapped: false }));
    obj.add(
      new THREE.Mesh(kit.body, bodyMats[Math.floor(rand() * bodyMats.length)]),
      new THREE.Mesh(kit.glass, glassMat),
      new THREE.Mesh(kit.wheels, tyreMat),
      new THREE.Mesh(kit.head, headMat),
      new THREE.Mesh(kit.tail, tail),
    );
    obj.visible = false;
    root.add(obj);
    return { obj, tail };
  };

  const vehicles: Vehicle[] = [
    ...[0, 1, 2].map(() => ({ ...makeCar(), d: 0, v: 0, v0: 12 + rand() * 2.5, u: LANE / 2, dir: 1 as const, on: false })),
    ...[0, 1, 2, 3, 4].map((i) => ({ ...makeCar(), d: 0, v: 0, v0: 11.5 + rand() * 3, u: i % 2 ? -CAR_U : -LANE / 2, dir: -1 as const, on: false })),
  ];
  const crossers: Crosser[] = [0, 1, 2, 3].map(() => ({ ...makeCar(), j: -1, p: 0, v: 0, side: 1, on: false }));

  const pedGeo = mergeGeometries([new THREE.CapsuleGeometry(0.2, 0.9, 4, 10).translate(0, 0.65, 0), new THREE.SphereGeometry(0.12, 12, 10).translate(0, 1.52, 0)])!;
  const pedMats = PED_COLORS.map((c) => track(new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })));
  const makePed = () => {
    const m = new THREE.Mesh(pedGeo, pedMats[Math.floor(rand() * pedMats.length)]);
    root.add(m);
    return m;
  };

  JUNCTIONS.forEach((j) => {
    for (let k = 0; k < 3; k++) {
      if (rand() < 0.25) continue;
      const near = k !== 1;
      const u = (k === 2 ? -1 : 1) * (near ? 1 : -1) * (HALF + 0.9 + rand() * 1.4);
      const d = j.d + (near ? -1 : 1) * (j.half + 1.2 + rand() * 3);
      pose(path, d, u, o);
      const m = makePed();
      m.position.set(o.x, KERB - 0.002, o.z);
      m.rotation.y = Math.atan2(o.tz * Math.sign(u), -o.tx * Math.sign(u));
    }
  });

  const walkers: Walker[] = Array.from({ length: 12 }, () => {
    const obj = makePed();
    obj.visible = false;
    return { obj, d: 0, u: 0, dir: 1 as const, along: false, speed: 1.4, phase: 0, on: false };
  });

  const housing = track(new THREE.MeshStandardMaterial({ color: "#1c1f23", metalness: 0.4, roughness: 0.6 }));
  const lampOff = track(new THREE.MeshBasicMaterial({ color: "#16181b" }));
  const lampOn = SIGNAL.map((c) => track(new THREE.MeshBasicMaterial({ color: c, toneMapped: false })));
  const halo = haloTexture();
  const haloMats = SIGNAL.map((c) => track(new THREE.SpriteMaterial({ map: halo, color: c, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  const heads: [number, number, number][] = [
    [-3.6, 4.6, 0],
    [0, 3.0, 0.2],
  ];
  const frame = mergeGeometries([
    new THREE.CylinderGeometry(0.07, 0.09, 5.6, 12).translate(0, 2.8, 0),
    new THREE.CylinderGeometry(0.05, 0.05, 4.4, 10).rotateZ(Math.PI / 2).translate(-2.2, 5.3, 0),
    new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8).translate(-3.6, 5.1, 0),
    ...heads.map(([x, y, z]) => new THREE.BoxGeometry(0.36, 1.0, 0.3).translate(x, y, z)),
  ])!;
  const lampGeo = new THREE.CircleGeometry(0.11, 20);
  const rigs: Rig[] = [];
  JUNCTIONS.forEach((j) => {
    if (j.light < 0) return;
    for (const dir of [1, -1]) {
      const g = new THREE.Group();
      pose(path, j.d - dir * (j.half + 6), dir * (HALF + 0.9), o);
      g.position.set(o.x, KERB - 0.002, o.z);
      g.rotation.y = Math.atan2(-o.tx * dir, -o.tz * dir);
      g.add(new THREE.Mesh(frame, housing));
      const rig: Rig = { light: j.light, lamps: [], halos: [] };
      for (const [x, y, z] of heads) {
        [0.31, 0, -0.31].forEach((dy) => {
          const lamp = new THREE.Mesh(lampGeo, lampOff);
          lamp.position.set(x, y + dy, z + 0.155);
          const h = new THREE.Sprite(haloMats[0]);
          h.position.set(x, y + dy, z + 0.2);
          h.scale.setScalar(0.95);
          h.visible = false;
          g.add(lamp, h);
          rig.lamps.push(lamp);
          rig.halos.push(h);
        });
      }
      root.add(g);
      rigs.push(rig);
    }
  });

  root.visible = false;
  return {
    path,
    root,
    fade,
    roadMat,
    stubMat,
    geo,
    vehicles,
    crossers,
    walkers,
    rigs,
    lampOff,
    lampOn,
    haloMats,
    sim: { lastD: Number.NaN, crossT: 0, walkT: 0, strollT: 0 },
    o,
    dispose: () => {
      root.traverse((c) => (c as THREE.Mesh).geometry?.dispose());
      [roadMat, stubMat, ...fade].forEach((m) => m.dispose());
      Object.values(kit).forEach((g) => g.dispose());
      halo.dispose();
    },
  };
}

export function Road({ mix }: { mix: RefObject<number> }) {
  const built = useMemo(() => buildWorld(), []);
  const world = useRef(built);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => built.dispose, [built]);

  useFrame((_, dt) => {
    const w = world.current;
    const k = mix.current;
    w.root.visible = k > 0;
    w.roadMat.uniforms.uOpacity.value = k;
    w.stubMat.uniforms.uOpacity.value = k;
    for (const m of w.fade) m.opacity = k;
    if (k <= 0) {
      w.sim.lastD = Number.NaN;
      return;
    }
    invalidate();

    const s = useCar.getState();
    const step = Math.min(dt, 1 / 30);
    const carD = s.routeD;
    const end = w.path.n - 30;
    const o = w.o;
    const fresh = !(Math.abs(carD - w.sim.lastD) < 60);
    w.sim.lastD = carD;

    pose(w.path, carD, CAR_U, o);
    const th = Math.atan2(-o.tx, o.tz);
    const c = Math.cos(th);
    const sn = Math.sin(th);
    w.root.rotation.y = th;
    w.root.position.set(-(o.x * c + o.z * sn), 0, -(-o.x * sn + o.z * c));

    const lights = new Map<number, number>();
    for (const r of w.rigs) {
      const st = lights.get(r.light) ?? signal(r.light, s);
      lights.set(r.light, st);
      r.lamps.forEach((lamp, i) => {
        const on = i % 3 === 2 - st;
        lamp.material = on ? w.lampOn[st] : w.lampOff;
        r.halos[i].visible = on;
        r.halos[i].material = w.haloMats[st];
      });
    }
    const jr = JUNCTIONS.findIndex((j) => j.light >= 0 && j.light === s.stopIdx);
    const red = jr >= 0 && (lights.get(JUNCTIONS[jr].light) ?? GREEN) !== GREEN;
    const crossGo = jr >= 0 && lights.get(JUNCTIONS[jr].light) === RED && (!s.holdUntil || s.now < s.holdUntil - 3500);

    if (fresh) {
      w.vehicles.forEach((veh, i) => {
        veh.on = false;
        veh.v = veh.v0 * 0.8;
        veh.d = veh.dir > 0 ? carD + 18 + i * 38 : carD + 25 + (i - 3) * 30;
      });
      w.crossers.forEach((x) => (x.on = false));
      w.walkers.forEach((x) => (x.on = false));
    }

    const stopFor = (dir: 1 | -1, d: number) => {
      if (!red || jr < 0) return Infinity;
      const j = JUNCTIONS[jr];
      const line = j.d - dir * (j.half + 5.4);
      const nose = d + dir * 2.3;
      const gap = dir * (line - nose) + 2;
      return gap > -1 ? gap : Infinity;
    };

    for (const veh of w.vehicles) {
      const lane = w.vehicles.filter((x) => x !== veh && x.on && x.u === veh.u);
      if (!veh.on || fresh) {
        const far = lane.reduce((m, x) => Math.max(m, x.d), carD);
        veh.d = fresh ? veh.d : veh.dir > 0 ? Math.max(carD + 90, far + 24) + Math.random() * 30 : Math.max(carD + 110, far + 30) + Math.random() * 40;
        veh.v = veh.v0 * 0.8;
        veh.on = veh.d > 1 && veh.d < end;
        if (!veh.on) {
          veh.obj.visible = false;
          continue;
        }
      }
      const v0 = veh.d > 7900 ? Math.min(veh.v0, 8.5) : veh.v0;
      let gap = stopFor(veh.dir, veh.d);
      for (const x of lane) {
        const g = veh.dir * (x.d - veh.d) - 4.6;
        if (g > -2) gap = Math.min(gap, Math.max(0.1, g));
      }
      const acc = idm(veh.v, v0, gap);
      veh.v = Math.max(0, veh.v + acc * step);
      veh.d += veh.dir * veh.v * step;
      veh.tail.color.set(acc < -0.6 || veh.v < 0.4 ? "#ff2a1a" : "#5a0f0c");
      if ((veh.dir > 0 && (veh.d < carD - 30 || veh.d > carD + 220)) || (veh.dir < 0 && veh.d < carD - 25) || veh.d > end) {
        veh.on = false;
        veh.obj.visible = false;
        continue;
      }
      pose(w.path, veh.d, veh.u, o);
      veh.obj.visible = true;
      veh.obj.position.set(o.x, 0, o.z);
      veh.obj.rotation.y = Math.atan2(o.tx * veh.dir, o.tz * veh.dir);
    }

    w.sim.crossT -= step;
    if (crossGo && w.sim.crossT <= 0) {
      const x = w.crossers.find((q) => !q.on);
      if (x) {
        const busy = w.crossers.filter((q) => q.on && q.j === jr);
        x.side = busy.filter((q) => q.side === 1).length > busy.filter((q) => q.side === -1).length ? -1 : 1;
        Object.assign(x, { on: true, j: jr, p: -58, v: 12 });
      }
      w.sim.crossT = 2.2 + Math.random() * 2.6;
    }
    for (const x of w.crossers) {
      if (!x.on) continue;
      const j = JUNCTIONS[x.j];
      if (x.p > 62 || Math.abs(carD - j.d) > 220) {
        x.on = false;
        x.obj.visible = false;
        continue;
      }
      let gap = Infinity;
      if (!crossGo || x.j !== jr) {
        const g = -CROSS_LINE - (x.p + 2.3) + 2;
        if (g > -1) gap = g;
      }
      for (const q of w.crossers) {
        if (q === x || !q.on || q.j !== x.j || q.side !== x.side || q.p <= x.p) continue;
        gap = Math.min(gap, Math.max(0.1, q.p - x.p - 4.6));
      }
      const acc = idm(x.v, 12.5, gap);
      x.v = Math.max(0, x.v + acc * step);
      x.p += x.v * step;
      x.tail.color.set(acc < -0.6 || x.v < 0.4 ? "#ff2a1a" : "#5a0f0c");
      const g = w.geo[x.j];
      const ax = -g.dz * x.side;
      const az = g.dx * x.side;
      x.obj.visible = true;
      x.obj.position.set(g.cx + ax * x.p - x.side * g.dx * 2.5, 0, g.cz + az * x.p - x.side * g.dz * 2.5);
      x.obj.rotation.y = Math.atan2(ax, az);
    }

    w.sim.walkT -= step;
    const crossing = jr >= 0 && lights.get(JUNCTIONS[jr].light) === RED && STOPS[JUNCTIONS[jr].light] - carD > 20;
    if (crossing && w.sim.walkT <= 0) {
      const x = w.walkers.find((q) => !q.on);
      if (x) {
        const j = JUNCTIONS[jr];
        const dir = Math.random() < 0.5 ? 1 : -1;
        Object.assign(x, {
          on: true,
          along: false,
          d: j.d + (Math.random() < 0.5 ? -1 : 1) * (j.half + 2.6) + (Math.random() - 0.5) * 2.2,
          dir,
          u: -dir * (HALF + 2),
          speed: 1.25 + Math.random() * 0.35,
          phase: Math.random() * 6,
        });
      }
      w.sim.walkT = 0.8 + Math.random() * 1.4;
    }
    w.sim.strollT -= step;
    if (w.sim.strollT <= 0) {
      const x = w.walkers.find((q) => !q.on);
      const d = carD + 35 + Math.random() * 70;
      if (x && d < end && !JUNCTIONS.some((j) => Math.abs(d - j.d) < j.half + 6)) {
        const side = Math.random() < 0.5 ? 1 : -1;
        Object.assign(x, {
          on: true,
          along: true,
          d,
          dir: Math.random() < 0.5 ? 1 : -1,
          u: side * (HALF + 1.1 + Math.random() * 1.4),
          speed: 1.1 + Math.random() * 0.4,
          phase: Math.random() * 6,
        });
      }
      w.sim.strollT = 1.6 + Math.random() * 2.4;
    }
    for (const x of w.walkers) {
      if (!x.on) continue;
      if (x.along) x.d += x.dir * x.speed * step;
      else x.u += x.dir * x.speed * step;
      const done = x.along ? x.d < carD - 15 || x.d > carD + 130 || JUNCTIONS.some((j) => Math.abs(x.d - j.d) < j.half + 0.5) : x.dir * x.u > HALF + 2.2;
      if (done) {
        x.on = false;
        x.obj.visible = false;
        continue;
      }
      x.phase += step * x.speed * 4.2;
      pose(w.path, x.d, x.u, o);
      const kerb = Math.abs(x.u) > HALF && !JUNCTIONS.some((j) => Math.abs(x.d - j.d) < j.half) ? KERB : 0;
      x.obj.visible = true;
      x.obj.position.set(o.x, kerb + Math.abs(Math.sin(x.phase)) * 0.05, o.z);
      x.obj.rotation.set(0, x.along ? Math.atan2(o.tx * x.dir, o.tz * x.dir) : Math.atan2(-o.tz * x.dir, o.tx * x.dir), Math.sin(x.phase) * 0.04);
    }
  });

  return (
    <>
      <fog attach="fog" args={[BG, FOG[0], FOG[1]]} />
      <primitive object={built.root} />
    </>
  );
}
