"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const ORBITA_PALETTES = [
  { id: "amber", label: "Dourado", color: "#D6A64B", soft: "#3A2B13" },
  { id: "orange", label: "Laranja", color: "#F07835", soft: "#3B2115" },
  { id: "blue", label: "Azul", color: "#438FF5", soft: "#172B49" },
  { id: "green", label: "Verde", color: "#2FB887", soft: "#15372D" },
  { id: "purple", label: "Roxo", color: "#A477F5", soft: "#2C1D45" },
  { id: "red", label: "Vermelho", color: "#E45C65", soft: "#421D24" },
] as const;

export type OrbitaPalette = (typeof ORBITA_PALETTES)[number]["id"];

type PaletteContextValue = {
  palette: OrbitaPalette;
  setPalette: (palette: OrbitaPalette) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

function isPalette(value: string | null): value is OrbitaPalette {
  return ORBITA_PALETTES.some((item) => item.id === value);
}

export function PaletteProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [palette, setPaletteState] = useState<OrbitaPalette>("amber");
  const storageKey = `orbita:palette:${userId}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (isPalette(saved)) setPaletteState(saved);
    } catch {
      // Storage can be unavailable in private browsing; keep the default.
    }
  }, [storageKey]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const setPalette = useCallback(
    (next: OrbitaPalette) => {
      setPaletteState(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Keep the selection for this session even if storage is unavailable.
      }
    },
    [storageKey],
  );

  const value = useMemo(() => ({ palette, setPalette }), [palette, setPalette]);

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}

export function useOrbitaPalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("useOrbitaPalette must be used within PaletteProvider");
  }
  return context;
}
