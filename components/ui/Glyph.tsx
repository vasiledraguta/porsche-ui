"use client";

import {
  AppWindow,
  Bell,
  CarFront,
  CirclePlay,
  LayoutGrid,
  Music2,
  Navigation2,
  Phone,
  Settings,
  Smartphone,
  SquareParking,
  Thermometer,
  Timer,
  type LucideIcon,
} from "lucide-react";

export const APPS = {
  nav: { label: "Navigation", icon: Navigation2, color: "#39a6ff", fill: true },
  media: { label: "Media", icon: Music2, color: "#ff4a4a", fill: false },
  phone: { label: "Phone", icon: Phone, color: "#3fd46b", fill: true },
  vehicle: { label: "Vehicle", icon: CarFront, color: "#f2f4f7", fill: false },
  climate: { label: "Air conditioning", icon: Thermometer, color: "#6fb8ff", fill: false },
  notifications: { label: "Notifications", icon: Bell, color: "#f2f4f7", fill: false },
  chrono: { label: "Sport Chrono", icon: Timer, color: "#ff5a4e", fill: false },
  parking: { label: "Parking", icon: SquareParking, color: "#f2f4f7", fill: false },
  devices: { label: "Devices", icon: Smartphone, color: "#f2f4f7", fill: false },
  carplay: { label: "Apple CarPlay", icon: CirclePlay, color: "#3fd46b", fill: false },
  apps: { label: "App Center", icon: LayoutGrid, color: "#f2f4f7", fill: false },
  settings: { label: "Settings", icon: Settings, color: "#a9afb8", fill: false },
  androidauto: { label: "Android Auto", icon: AppWindow, color: "#a9afb8", fill: false },
} satisfies Record<string, { label: string; icon: LucideIcon; color: string; fill: boolean }>;

export type AppId = keyof typeof APPS;

export function Glyph({ id, size = 22, dim = false }: { id: AppId; size?: number; dim?: boolean }) {
  const a = APPS[id];
  const Icon = a.icon;
  return (
    <Icon
      size={`${Math.round((size / 16) * 20) / 20}rem`}
      strokeWidth={1.7}
      color={a.color}
      fill={a.fill ? a.color : "none"}
      style={{ opacity: dim ? 0.55 : 1, filter: `drop-shadow(0 0 0.65rem ${a.color}33)` }}
    />
  );
}
