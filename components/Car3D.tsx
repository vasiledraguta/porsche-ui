"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AMBIENT, PAINTS, useCar, type Paint, type PartId } from "@/lib/store";

/**
 * Porsche 911 GT3 RS (992) by Black Snow on Sketchfab, CC-BY-4.0 (credit in README).
 * Optimised with gltf-transform (meshopt + WebP): 19.5 MB → 3.1 MB.
 */
const MODEL = "/car/911-gt3-rs.glb";

/** 3/4 front-left hero camera (model nose points to +Z, driver side is +X). */
const HERO: [number, number, number] = [5.9, 2.2, 6.1];
const TARGET: [number, number, number] = [0, 0.5, 0];
const RESPIN_MS = 4000;
const SPIN_HOLD_MS = 600;
const SPIN_SPEED = 0.6;
const SPIN_RAMP_S = 1.6;
const GLIDE_MIN_S = 0.8;
const GLIDE_MAX_S = 1.8;
const GLIDE_S_PER_RAD = 0.45;

const PAINT_MATERIAL = "TwiXeR_992_carPaint.003";

const AMBIENT_RIM = 4;

type PartDef = {
  label: string;
  /** node names that move together; the first one defines the hinge */
  nodes: string[];
  hinge: (b: THREE.Box3) => THREE.Vector3;
  axis: "x" | "y";
  open: number;
  /** where the callout sits on the panel, and the direction it faces */
  spot: (b: THREE.Box3) => THREE.Vector3;
  normal: [number, number, number];
};

const PARTS: Record<PartId, PartDef> = {
  // front luggage lid: hinged at the windscreen end, nose lifts up
  hood: {
    label: "Front trunk",
    nodes: ["TwiXeR_992_gt3rs_carbon_hood"],
    hinge: (b) => new THREE.Vector3(0, b.max.y, b.min.z + 0.03),
    axis: "x",
    open: -0.9,
    spot: (b) => new THREE.Vector3(0, b.max.y + 0.05, THREE.MathUtils.lerp(b.min.z, b.max.z, 0.62)),
    normal: [0, 0.8, 1],
  },
  // rear engine lid: the swan-neck wing is mounted on it, so it lifts with the lid
  trunk: {
    label: "Engine lid",
    nodes: ["TwiXeR_992_gt3rs_tailgate", "TwiXeR_992_gt3rs_carbon_Wing"],
    hinge: (b) => new THREE.Vector3(0, b.max.y, b.max.z),
    axis: "x",
    open: 0.62,
    spot: (b) => new THREE.Vector3(0, b.max.y + 0.42, b.min.z - 0.1),
    normal: [0, 0.6, -1],
  },
  // doors carry their window, trim, inner panel and mirror; hinged at the front edge
  doorL: {
    label: "Driver door",
    nodes: [
      "TwiXeR_992_gt3rs_door_L",
      "TwiXeR_992_doorglass_L_tint",
      "TwiXeR_992_door_L_chrome_end",
      "TwiXeR_992_door_L_antichrome_end",
      "TwiXeR_992_doorpanel_L_antichrome",
      "TwiXeR_992_mirror_L",
    ],
    hinge: (b) => new THREE.Vector3(b.max.x - 0.07, 0, b.max.z - 0.05),
    axis: "y",
    open: -1.0,
    spot: (b) => new THREE.Vector3(b.max.x + 0.06, THREE.MathUtils.lerp(b.min.y, b.max.y, 0.45), b.getCenter(new THREE.Vector3()).z),
    normal: [1, 0.2, 0],
  },
  doorR: {
    label: "Passenger door",
    nodes: [
      "TwiXeR_992_gt3rs_door_R",
      "TwiXeR_992_doorglass_R_tint",
      "TwiXeR_992_door_R_chrome_end",
      "TwiXeR_992_door_R_antichrome_end",
      "TwiXeR_992_doorpanel_R_antichrome",
      "TwiXeR_992_mirror_R",
    ],
    hinge: (b) => new THREE.Vector3(b.min.x + 0.07, 0, b.max.z - 0.05),
    axis: "y",
    open: 1.0,
    spot: (b) => new THREE.Vector3(b.min.x - 0.06, THREE.MathUtils.lerp(b.min.y, b.max.y, 0.45), b.getCenter(new THREE.Vector3()).z),
    normal: [-1, 0.2, 0],
  },
};

/** Game-rip badge meshes that don't belong on a road car. */
const HIDE = [/CSR2_Badge/i];

const FLAP = "TwiXeR_992_gt3rs_carbon_Wing_TwiXeR_992_carbon_roof001_0";
const FLAP_DRS = -0.16;

const PART_IDS = Object.keys(PARTS) as PartId[];
const NORMALS = Object.fromEntries(PART_IDS.map((id) => [id, new THREE.Vector3(...PARTS[id].normal).normalize()])) as Record<PartId, THREE.Vector3>;

type Callouts = RefObject<Partial<Record<PartId, HTMLDivElement | null>>>;

function useParts() {
  return {
    hood: useCar((s) => s.frunkOpen),
    trunk: useCar((s) => s.trunkOpen),
    doorL: useCar((s) => s.doorL),
    doorR: useCar((s) => s.doorR),
  };
}

function Model({ hover, setHover, calloutsRef }: { hover: PartId | null; setHover: (id: PartId | null) => void; calloutsRef: Callouts }) {
  const { scene } = useGLTF(MODEL, false, true);
  const open = useParts();
  const lift = useCar((s) => s.lift);
  const drs = useCar((s) => s.drs);
  const paint = useCar((s) => s.paint);
  const driving = useCar((s) => s.gear !== "P");
  const lifted = useRef<THREE.Group>(null);
  const placed = useRef<THREE.Group>(null);
  const spot = useMemo(() => new THREE.Vector3(), []);
  const toCamera = useMemo(() => new THREE.Vector3(), []);

  // Build once: repaint, hide decals, and re-parent each openable part under a hinge pivot.
  const rig = useMemo(() => {
    const root = scene.clone(true);
    root.updateMatrixWorld(true);

    const paint = new THREE.MeshPhysicalMaterial({
      color: PAINTS.silver.color,
      metalness: 0.75,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    });
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      if (HIDE.some((r) => r.test(m.name))) m.visible = false;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat?.name === PAINT_MATERIAL) m.material = paint;
      // darker privacy-style tint on the side and rear glass reads more like a real car in the studio
      if (mat?.name?.startsWith("TwiXeR_992_glass.004")) {
        mat.color.set("#0a0c0f");
        mat.opacity = 0.62;
      }
    });

    const pivots = {} as Record<PartId, THREE.Group>;
    const spots = {} as Record<PartId, THREE.Vector3>;
    for (const id of Object.keys(PARTS) as PartId[]) {
      const def = PARTS[id];
      const objs = def.nodes.map((n) => root.getObjectByName(n)).filter(Boolean) as THREE.Object3D[];
      // hinge is measured on the primary panel only (the ducktail wing rides along with the engine lid)
      const box = new THREE.Box3().setFromObject(objs[0]);
      const pivot = new THREE.Group();
      pivot.name = `pivot-${id}`;
      pivot.position.copy(def.hinge(box));
      spots[id] = def.spot(box);
      root.add(pivot);
      pivot.updateMatrixWorld(true);
      objs.forEach((o) => {
        pivot.attach(o);
        o.traverse((c) => (c.userData.part = id));
      });
      pivots[id] = pivot;
    }

    const flap = new THREE.Group();
    const flapMesh = root.getObjectByName(FLAP);
    if (flapMesh) {
      const fb = new THREE.Box3().setFromObject(flapMesh);
      flap.position.set(0, fb.max.y, fb.max.z);
      root.add(flap);
      flap.updateMatrixWorld(true);
      flap.attach(flapMesh);
      pivots.trunk.attach(flap);
    }

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    return { root, pivots, flap, spots, paint, offset: new THREE.Vector3(-center.x, -box.min.y, -center.z) };
  }, [scene]);

  // three.js objects are mutated every frame; keep them in a ref, outside React's immutable values
  // (the glTF scene is cached by useGLTF, so rig is built exactly once)
  const pivots = useRef(rig.pivots);
  const flap = useRef(rig.flap);
  const paintFade = useRef<{ target: Paint; from: THREE.Color; to: THREE.Color; elapsed: number } | null>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => invalidate(), [open.hood, open.trunk, open.doorL, open.doorR, lift, drs, paint, driving, invalidate]);

  useFrame((_, dt) => {
    let moving = false;
    if (paintFade.current?.target !== paint) {
      paintFade.current = { target: paint, from: rig.paint.color.clone(), to: new THREE.Color(PAINTS[paint].color), elapsed: 0 };
    }
    if (paintFade.current && paintFade.current.elapsed < 0.6) {
      paintFade.current.elapsed = Math.min(0.6, paintFade.current.elapsed + dt);
      rig.paint.color.lerpColors(paintFade.current.from, paintFade.current.to, paintFade.current.elapsed / 0.6);
      moving = paintFade.current.elapsed < 0.6;
    }
    for (const id of Object.keys(PARTS) as PartId[]) {
      const def = PARTS[id];
      const p = pivots.current[id];
      const target = open[id] ? def.open : 0;
      p.rotation[def.axis] = THREE.MathUtils.damp(p.rotation[def.axis], target, 4.2, dt);
      if (Math.abs(p.rotation[def.axis] - target) > 0.001) moving = true;
      else p.rotation[def.axis] = target;
    }
    const flapTarget = drs ? FLAP_DRS : 0;
    flap.current.rotation.x = THREE.MathUtils.damp(flap.current.rotation.x, flapTarget, 6, dt);
    if (Math.abs(flap.current.rotation.x - flapTarget) > 0.001) moving = true;
    else flap.current.rotation.x = flapTarget;
    if (lifted.current) {
      const y = lift ? 0.05 : 0;
      lifted.current.position.y = THREE.MathUtils.damp(lifted.current.position.y, y, 3, dt);
      if (Math.abs(lifted.current.position.y - y) > 0.0001) moving = true;
      else lifted.current.position.y = y;
    }
    if (moving) invalidate();
  });

  useFrame(({ camera, size }) => {
    if (!placed.current) return;
    for (const id of PART_IDS) {
      const el = calloutsRef.current[id];
      if (!el) continue;
      placed.current.localToWorld(spot.copy(rig.spots[id]));
      const facing = NORMALS[id].dot(toCamera.subVectors(camera.position, spot).normalize());
      const o = driving ? 0 : THREE.MathUtils.clamp((facing - 0.05) * 4, 0, 1);
      spot.project(camera);
      el.style.transform = `translate3d(${((spot.x + 1) / 2) * size.width}px, ${((1 - spot.y) / 2) * size.height}px, 0)`;
      el.style.opacity = String(o);
      el.style.pointerEvents = o > 0.3 ? "auto" : "none";
    }
  });

  const partOf = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.object.userData.part as PartId | undefined;

  return (
    <group ref={lifted}>
      <group ref={placed} position={rig.offset}>
        <primitive
          object={rig.root}
          onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            const id = driving ? null : (partOf(e) ?? null);
            if (id !== hover) {
              setHover(id);
              document.body.style.cursor = id ? "pointer" : "";
            }
          }}
          onPointerOut={() => {
            setHover(null);
            document.body.style.cursor = "";
          }}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            // ignore clicks that were really a drag-to-rotate
            if (driving || e.delta > 4) return;
            const id = partOf(e);
            if (id) {
              e.stopPropagation();
              useCar.getState().togglePart(id);
            }
          }}
        />
      </group>
    </group>
  );
}

/** Leader-line callout pinned to the body; fades out when that side faces away from the camera. */
function Callout({ ref, id, open, hot }: { ref: (el: HTMLDivElement | null) => void; id: PartId; open: boolean; hot: boolean }) {
  const { label } = PARTS[id];
  return (
    <div ref={ref} style={{ opacity: 0, pointerEvents: "none" }} className="absolute top-0 left-0 transition-opacity duration-150">
      <button
        onClick={() => useCar.getState().togglePart(id)}
        aria-label={`${open ? "Close" : "Open"} ${label}`}
        className="group absolute bottom-0 left-0 flex -translate-x-1/2 translate-y-[3px] flex-col items-center whitespace-nowrap transition [text-shadow:0_1px_3px_rgba(0,0,0,0.8)] active:scale-[0.96]"
      >
        <span
          className={`text-[11px] font-medium tracking-[0.04em] uppercase transition ${
            open ? "text-(--ambient)" : hot ? "text-white" : "text-white/70 group-hover:text-white"
          }`}
        >
          {label}
        </span>
        <span className={`mt-1 h-7 w-px transition ${hot ? "bg-white/70" : "bg-white/35 group-hover:bg-white/70"}`} />
        <span className={`h-1.5 w-1.5 rounded-full transition-colors ${open ? "bg-(--ambient)" : "bg-white"}`} />
      </button>
    </div>
  );
}

function Rig({ revealed }: { revealed: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const invalidate = useThree((s) => s.invalidate);
  const spin = useRef(false);
  const resetAt = useCar((s) => s.carViewReset);
  const last = useRef(resetAt);
  const driving = useCar((s) => s.gear !== "P");
  const wasDriving = useRef(driving);
  const glide = useRef<"hero" | null>(null);
  const view = useRef({
    t: -1,
    dur: GLIDE_MIN_S,
    at: new THREE.Spherical(),
    from: new THREE.Spherical(),
    goal: new THREE.Spherical(),
    offset: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    target: new THREE.Vector3(),
  });
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resume = useRef(false);

  useEffect(() => () => clearTimeout(idle.current), []);
  useEffect(() => invalidate(), [resetAt, driving, invalidate]);
  const land = useCallback(() => {
    clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      spin.current = true;
      invalidate();
    }, SPIN_HOLD_MS);
  }, [invalidate]);
  useEffect(() => {
    if (revealed) land();
  }, [revealed, land]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    // "Reset view" from the overlay: return to the 3/4 front hero angle
    if (resetAt !== last.current) {
      last.current = resetAt;
      glide.current = "hero";
      view.current.t = -1;
      clearTimeout(idle.current);
      spin.current = false;
      resume.current = true;
    }
    if (driving !== wasDriving.current) {
      wasDriving.current = driving;
      glide.current = null;
      clearTimeout(idle.current);
      spin.current = false;
      resume.current = false;
      if (!driving) {
        c.target.set(...TARGET);
        c.object.position.set(...HERO);
        c.update();
        land();
      }
    }
    c.autoRotate = spin.current && !driving && !glide.current;
    c.autoRotateSpeed = c.autoRotate ? Math.min(SPIN_SPEED, c.autoRotateSpeed + (SPIN_SPEED / SPIN_RAMP_S) * Math.min(dt, 1 / 30)) : 0;
    if (!glide.current) {
      if (c.autoRotate) invalidate();
      return;
    }
    const v = view.current;
    if (v.t < 0) {
      v.fromTarget.copy(c.target);
      v.target.set(...TARGET);
      v.from.setFromVector3(v.offset.copy(c.object.position).sub(c.target));
      v.goal.setFromVector3(v.offset.set(...HERO).sub(v.target));
      v.goal.theta = v.from.theta + Math.atan2(Math.sin(v.goal.theta - v.from.theta), Math.cos(v.goal.theta - v.from.theta));
      v.dur = THREE.MathUtils.clamp(GLIDE_MIN_S + Math.abs(v.goal.theta - v.from.theta) * GLIDE_S_PER_RAD, GLIDE_MIN_S, GLIDE_MAX_S);
      v.t = 0;
    }
    v.t = Math.min(1, v.t + Math.min(dt, 1 / 30) / v.dur);
    const e = v.t < 0.5 ? 4 * v.t ** 3 : 1 - (-2 * v.t + 2) ** 3 / 2;
    c.target.lerpVectors(v.fromTarget, v.target, e);
    v.at.set(
      THREE.MathUtils.lerp(v.from.radius, v.goal.radius, e),
      THREE.MathUtils.lerp(v.from.phi, v.goal.phi, e),
      THREE.MathUtils.lerp(v.from.theta, v.goal.theta, e),
    );
    c.object.position.copy(c.target).add(v.offset.setFromSpherical(v.at));
    c.update();
    if (v.t >= 1) {
      glide.current = null;
      if (resume.current) {
        resume.current = false;
        land();
      }
    }
    if (glide.current || (spin.current && !driving)) invalidate();
  }, -0.5);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={TARGET}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      minDistance={6.5}
      maxDistance={13}
      minPolarAngle={0.75}
      maxPolarAngle={1.5}
      enabled={!driving}
      onStart={() => {
        clearTimeout(idle.current);
        spin.current = false;
        resume.current = false;
        glide.current = null;
        if (controls.current) controls.current.autoRotate = false;
      }}
      onEnd={() => {
        idle.current = setTimeout(() => {
          spin.current = true;
          invalidate();
        }, RESPIN_MS);
      }}
    />
  );
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}

function AmbientTint() {
  const color = useCar((s) => AMBIENT[s.ambient]);
  const level = useCar((s) => s.ambientLevel / 100);
  const invalidate = useThree((s) => s.invalidate);
  const rimL = useRef<THREE.PointLight>(null);
  const rimR = useRef<THREE.PointLight>(null);
  const target = useMemo(() => new THREE.Color(), []);

  useEffect(() => invalidate(), [color, level, invalidate]);

  useFrame((_, dt) => {
    target.set(color);
    const k = 1 - Math.exp(-3 * dt);
    let moving = false;
    for (const rim of [rimL.current, rimR.current]) {
      if (!rim) continue;
      rim.color.lerp(target, k);
      rim.intensity = THREE.MathUtils.damp(rim.intensity, level * AMBIENT_RIM, 3, dt);
      if (Math.max(Math.abs(rim.color.r - target.r), Math.abs(rim.color.g - target.g), Math.abs(rim.color.b - target.b)) > 0.001) moving = true;
      else rim.color.copy(target);
      if (Math.abs(rim.intensity - level * AMBIENT_RIM) > 0.001) moving = true;
      else rim.intensity = level * AMBIENT_RIM;
    }
    if (moving) invalidate();
  });

  return (
    <>
      <pointLight ref={rimL} position={[-3.2, 0.35, 0]} intensity={0} distance={8} decay={2} />
      <pointLight ref={rimR} position={[3.2, 0.35, 0]} intensity={0} distance={8} decay={2} />
    </>
  );
}

/** Studio-lit, spinnable 3D car with openable lids and doors. */
export default function Car3D({ onReady, revealed }: { onReady: () => void; revealed: boolean }) {
  const open = useParts();
  const [hover, setHover] = useState<PartId | null>(null);
  const calloutsRef: Callouts = useRef({});
  return (
    <>
      <Canvas
        frameloop="demand"
        shadows="percentage"
        dpr={[1, 2]}
        // the display is CSS-scaled; measure layout size, not the transformed rect
        resize={{ offsetSize: true }}
        camera={{ position: HERO, fov: 30, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        className="!absolute inset-0"
      >
        <Suspense fallback={null}>
          <Model hover={hover} setHover={setHover} calloutsRef={calloutsRef} />
          <FirstFrame onReady={onReady} />
          <AmbientTint />
          <ContactShadows position={[0, 0.001, 0]} opacity={0.65} scale={9} blur={2.4} far={2} resolution={512} color="#000" />
          {/* local studio light rig, no HDR download */}
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
            <Lightformer intensity={1.4} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
            <Lightformer intensity={1.4} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
            <Lightformer intensity={0.8} position={[0, 1.5, -7]} scale={[8, 1.5, 1]} />
            <Lightformer intensity={0.8} position={[0, 1.5, 7]} rotation-y={Math.PI} scale={[8, 1.5, 1]} />
          </Environment>
        </Suspense>
        <ambientLight intensity={0.15} />
        <directionalLight position={[4, 8, 3]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <Rig revealed={revealed} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PART_IDS.map((id) => (
          <Callout
            key={id}
            ref={(el) => {
              calloutsRef.current[id] = el;
            }}
            id={id}
            open={open[id]}
            hot={hover === id}
          />
        ))}
      </div>
    </>
  );
}

useGLTF.preload(MODEL, false, true);
