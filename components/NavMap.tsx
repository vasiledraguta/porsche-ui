"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cubicBezier } from "motion";
import { PANEL_EASE, PANEL_S, PANEL_W } from "./CarPanel";
import { ROUTE, positionAt } from "@/lib/route";
import { useCar } from "@/lib/store";

const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

// MapLibre v6 ships an ESM worker; bundlers can't resolve it, so it's served from /public.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

function porscheify(style: StyleSpecification): StyleSpecification {
  const paint: Record<string, Record<string, unknown>> = {
    background: { "background-color": "#14171b" },
    water: { "fill-color": "#0d1a26" },
    landuse_residential: { "fill-color": "#171a1f", "fill-opacity": 0.6 },
    landuse_park: { "fill-color": "#15201b" },
    landcover_wood: { "fill-color": "#15201b", "fill-opacity": 0.6 },
    building: { "fill-color": "#1c2026", "fill-outline-color": "#22272e" },
    highway_minor: { "line-color": "#262b32" },
    highway_major_casing: { "line-color": "#2e343c" },
    highway_major_inner: { "line-color": "#353c45" },
    highway_major_subtle: { "line-color": "#2a3037" },
    highway_motorway_casing: { "line-color": "#3a414b" },
    highway_motorway_inner: { "line-color": "#4a525d" },
    highway_motorway_subtle: { "line-color": "#39404a" },
    highway_path: { "line-color": "#20252b" },
    highway_name_other: { "text-color": "#6f7782", "text-halo-color": "#14171b" },
    highway_name_motorway: { "text-color": "#8a929c", "text-halo-color": "#14171b" },
    place_suburb: { "text-color": "#6d7580" },
    place_village: { "text-color": "#6d7580" },
    place_town: { "text-color": "#8b939d" },
    place_city: { "text-color": "#a0a7b0" },
  };
  return {
    ...style,
    layers: style.layers
      .filter((l) => !l.id.startsWith("boundary") && l.id !== "road_oneway" && l.id !== "road_oneway_opposite")
      .map((l) => {
        const p = paint[l.id];
        const missingIcon = l.id === "place_town" || l.id === "place_city" || l.id === "place_city_large";
        if (!p && !missingIcon) return l;
        const merged = { ...(("paint" in l && l.paint) || {}), ...p } as Record<string, unknown>;
        const layout = { ...(("layout" in l && l.layout) || {}) } as Record<string, unknown>;
        if (l.id === "landcover_wood") delete merged["fill-pattern"];
        if (missingIcon) delete layout["icon-image"];
        return { ...l, layout, paint: merged } as typeof l;
      }),
  };
}

const panelEase = cubicBezier(...PANEL_EASE);
const panelPad = () => (useCar.getState().gear === "P" ? PANEL_W : 0);

export function NavMap({ mapRef }: { mapRef: RefObject<maplibregl.Map | null> }) {
  const el = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const padLeft = useRef(0);
  const [failed, setFailed] = useState(false);
  const puck = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!el.current) return;
    let map: maplibregl.Map | null = null;
    let cancelled = false;

    fetch(STYLE_URL)
      .then((r) => r.json())
      .then((style: StyleSpecification) => {
        if (cancelled || !el.current) return;
        const start = positionAt(0);
        map = new maplibregl.Map({
          container: el.current,
          style: porscheify(style),
          center: start.pos,
          zoom: 16.4,
          pitch: 55,
          bearing: start.heading,
          attributionControl: false,
          interactive: true,
          dragRotate: true,
          pitchWithRotate: true,
          touchPitch: true,
          maxPitch: 75,
          fadeDuration: 0,
          cancelPendingTileRequestsWhileZooming: false,
        });
        mapRef.current = map;
        padLeft.current = panelPad();
        map.setPadding({ top: 180, bottom: 0, left: padLeft.current, right: 0 });
        // Hand the camera to the user the moment they touch the map. This has to happen on
        // press, not on dragstart: the follow loop's jumpTo() stops in-progress gestures, so a
        // drag would otherwise be cancelled before it ever reached dragstart.
        const release = () => {
          if (useCar.getState().follow) useCar.getState().set({ follow: false });
        };
        map.on("mousedown", release);
        map.on("touchstart", release);
        map.on("wheel", release);
        map.getCanvasContainer().style.cursor = "grab";
        map.on("load", () => {
          if (!map) return;
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: ROUTE.coords } },
            lineMetrics: true,
          });
          map.addLayer({
            id: "route-casing",
            type: "line",
            source: "route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#0b3d73",
              "line-width": ["interpolate", ["linear"], ["zoom"], 12, 6, 17, 16],
            },
          });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "#2f8fff",
              "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3.5, 17, 10],
            },
          });
          map.addSource("dest", {
            type: "geojson",
            data: { type: "Point", coordinates: ROUTE.coords[ROUTE.coords.length - 1] },
          });
          map.addLayer({
            id: "dest",
            type: "circle",
            source: "dest",
            paint: {
              "circle-radius": 7,
              "circle-color": "#ffffff",
              "circle-stroke-color": "#2f8fff",
              "circle-stroke-width": 4,
            },
          });
          setReady(true);
        });
        const seenErrors = new Set<string>();
        map.on("error", (e) => {
          const message = e.error?.message ?? "Unknown map error";
          if (seenErrors.has(message)) return;
          seenErrors.add(message);
          console.warn("map", e.error ?? message);
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [mapRef]);

  useEffect(() => {
    if (!ready) return;
    let last = 0;
    const pad = { from: padLeft.current, to: padLeft.current, at: -Infinity };
    const unsub = useCar.subscribe((s) => {
      const map = mapRef.current;
      if (!map) return;
      const target = s.gear === "P" ? PANEL_W : 0;
      if (target !== pad.to) {
        Object.assign(pad, { from: padLeft.current, to: target, at: s.now });
        if (!s.follow) map.easeTo({ padding: { top: 180, bottom: 0, left: target, right: 0 }, duration: PANEL_S * 1000, easing: panelEase });
      }
      const k = Math.min(1, (s.now - pad.at) / (PANEL_S * 1000));
      padLeft.current = pad.from + (pad.to - pad.from) * panelEase(k);
      if (k >= 1 && s.now - last < 33) return;
      last = s.now;
      const { pos, heading } = positionAt(s.routeD);
      if (s.follow && !map.isMoving()) {
        const zoom = 17.1 - Math.min(1.3, s.speed / 55) + s.zoomBias;
        map.jumpTo({
          center: pos,
          bearing: map.getBearing() + shortest(map.getBearing(), heading) * 0.12,
          zoom: map.getZoom() + (zoom - map.getZoom()) * 0.08,
          pitch: map.getPitch() + ((s.map3d ? 58 : 0) - map.getPitch()) * 0.15,
          padding: { top: 180, bottom: 0, left: padLeft.current, right: 0 },
        });
      }
      // rotationAlignment "map" already compensates for the camera bearing, so pass the true heading
      puck.current?.setLngLat(pos).setRotation(heading);
    });
    const p = document.createElement("div");
    p.innerHTML = `<div style="width:2.15rem;height:2.15rem;display:grid;place-items:center">
      <svg width="2.15rem" height="2.15rem" viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" fill="#2f8fff" fill-opacity=".18"/>
      <path d="M17 5 L26 27 L17 22 L8 27 Z" fill="#fff" stroke="#0b1a2a" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`;
    puck.current = new maplibregl.Marker({ element: p, pitchAlignment: "map", rotationAlignment: "map" })
      .setLngLat(ROUTE.coords[0])
      .setRotation(positionAt(useCar.getState().routeD).heading)
      .addTo(mapRef.current!);
    return () => {
      unsub();
      puck.current?.remove();
    };
  }, [ready, mapRef]);

  const follow = useCar((s) => s.follow);
  const map3d = useCar((s) => s.map3d);

  useEffect(() => {
    const map = mapRef.current;
    if (map && !useCar.getState().follow) map.easeTo({ pitch: map3d ? 58 : 0, duration: 500 });
  }, [map3d, mapRef]);
  useEffect(() => {
    const map = mapRef.current;
    if (!follow || !map) return;
    const s = useCar.getState();
    if (s.zoomBias) s.set({ zoomBias: 0 });
    const { pos, heading } = positionAt(s.routeD);
    map.easeTo({
      center: pos,
      bearing: heading,
      zoom: 16.4,
      pitch: s.map3d ? 58 : 0,
      padding: { top: 180, bottom: 0, left: padLeft.current, right: 0 },
      duration: 700,
    });
  }, [follow, mapRef]);

  return (
    <div className="absolute inset-0">
      {/* maplibre-gl.css forces .maplibregl-map { position: relative }, so size by h/w, not inset */}
      <div ref={el} className="h-full w-full" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-[#14171b] text-[0.8rem] text-white/40">
          Map unavailable offline
        </div>
      )}
    </div>
  );
}

function shortest(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}
