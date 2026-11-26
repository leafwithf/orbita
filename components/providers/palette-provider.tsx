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
  { id: "amber", label: "Singularidade", color: "#E58B5A", gradient: "linear-gradient(135deg, #8B7BD8, #E58B5A 55%, #E9CB8B)" },
  { id: "orange", label: "P\u00f4r do sol", color: "#EE8C78", gradient: "linear-gradient(135deg, #C08AD6, #EE8C78 55%, #F2C29A)" },
  { id: "blue", label: "Oceano", color: "#6FB1E6", gradient: "linear-gradient(135deg, #7C8FE0, #6FB1E6 55%, #A8E0E6)" },
  { id: "green", label: "Floresta", color: "#6FC49C", gradient: "linear-gradient(135deg, #6FA8A0, #6FC49C 55%, #C5E3A8)" },
  { id: "purple", label: "Aurora", color: "#B392EC", gradient: "linear-gradient(135deg, #9A86E6, #C78BE0 55%, #F0B8D8)" },
  { id: "red", label: "Rubi", color: "#E07787", gradient: "linear-gradient(135deg, #A77CC8, #E07787 55%, #F2BE9C)" },
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
