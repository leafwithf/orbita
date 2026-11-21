"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { updatePaletteAction } from "@/lib/actions/preferences";

export const ORBITA_PALETTES = [
  { id: "amber", label: "Dourado", color: "#D6A64B" },
  { id: "orange", label: "Laranja", color: "#F07835" },
  { id: "blue", label: "Azul", color: "#438FF5" },
  { id: "green", label: "Verde", color: "#2FB887" },
  { id: "purple", label: "Roxo", color: "#A477F5" },
  { id: "red", label: "Vermelho", color: "#E45C65" },
] as const;

export type OrbitaPalette = (typeof ORBITA_PALETTES)[number]["id"];

type PaletteContextValue = {
  palette: OrbitaPalette;
  setPalette: (palette: OrbitaPalette) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({
  initialPalette,
  children,
}: {
  initialPalette: OrbitaPalette;
  children: ReactNode;
}) {
  const [palette, setPaletteState] = useState<OrbitaPalette>(initialPalette);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const setPalette = useCallback((next: OrbitaPalette) => {
    setPaletteState(next);
    void updatePaletteAction(next);
  }, []);

  const value = useMemo(() => ({ palette, setPalette }), [palette, setPalette]);

  return (
    <PaletteContext.Provider value={value}>
      {children}
    </PaletteContext.Provider>
  );
}

export function useOrbitaPalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("useOrbitaPalette must be used within PaletteProvider");
  }
  return context;
}
