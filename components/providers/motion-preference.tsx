"use client";

import { useEffect } from "react";

type MotionLevel = "completo" | "leve" | "minimo";

const STORAGE_KEY = "orbita-motion-preference";

function detectMotionLevel(): MotionLevel {
  if (typeof window === "undefined") return "completo";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return "minimo";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  const lowHardware =
    (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) ||
    (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) ||
    nav.connection?.saveData === true;

  return lowHardware ? "leve" : "completo";
}

export function MotionPreferenceProvider() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const valid = saved === "completo" || saved === "leve" || saved === "minimo";
      const level = valid ? (saved as MotionLevel) : detectMotionLevel();

      root.dataset.motion = level;
    };

    apply();

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, []);

  return null;
}
