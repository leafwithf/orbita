"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, type LucideIcon, Check } from "lucide-react";
import { useTheme } from "next-themes";

import {
  ORBITA_PALETTES,
  useOrbitaPalette,
} from "@/components/providers/palette-provider";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: "light" | "dark" | "system";
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "light",
    label: "Claro",
    description: "Superfícies claras e contraste suave.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Escuro",
    description: "Grafite profundo para ambientes com pouca luz.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Automático",
    description: "Acompanha a preferência do dispositivo.",
    icon: Monitor,
  },
];

const subscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemePreference() {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = useOrbitaPalette();
  const mounted = useMounted();
  const current = mounted ? theme ?? "system" : undefined;

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="text-[13px] font-semibold">Paleta de cores</legend>
        <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">
          Personalize os destaques, botões, seleções e elementos da marca.
          Prioridades, alertas e estados continuam com suas cores próprias.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ORBITA_PALETTES.map((option) => {
            const checked = palette === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={checked}
                onClick={() => setPalette(option.id)}
                className={cn(
                  "flex min-h-[68px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                  checked
                    ? "border-brand bg-brand/5 shadow-[0_0_0_2px_color-mix(in_srgb,var(--brand)_18%,transparent)]"
                    : "border-border bg-surface hover:border-border-strong hover:bg-surface-2",
                )}
              >
                <span
                  className="grid size-9 flex-none place-items-center rounded-full"
                  style={{ backgroundColor: option.color }}
                >
                  {checked ? <Check className="size-4 text-white" aria-hidden="true" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[10.5px] text-muted">
                    {checked ? "Em uso" : "Selecionar"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="border-t border-border pt-5">
        <fieldset>
          <legend className="text-[13px] font-semibold">Aparência</legend>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Escolha entre tema claro, escuro ou automático. A paleta escolhida
            permanece a mesma nos três modos.
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const checked = current === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col gap-2 rounded-xl border bg-surface px-3.5 py-3 transition-colors",
                    checked
                      ? "border-brand ring-2 ring-brand/20"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="theme-preference"
                      value={option.value}
                      checked={checked}
                      onChange={() => setTheme(option.value)}
                      className="size-4 accent-[var(--brand)]"
                    />
                    <Icon className="size-4 text-brand" aria-hidden="true" />
                    <span className="text-[13px] font-semibold">{option.label}</span>
                  </span>
                  <span className="text-[11.5px] leading-relaxed text-muted">
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
      <p className="text-[11.5px] leading-relaxed text-faint">
        A paleta fica salva separadamente para cada conta neste dispositivo.
        O modo claro/escuro é uma preferência independente.
      </p>
    </div>
  );
}
