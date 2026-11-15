"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const OPTIONS: { value: "light" | "dark" | "system"; label: string; description: string; icon: LucideIcon }[] = [
  {
    value: "light",
    label: "Claro",
    description: "Fundo claro com contraste AA.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Escuro",
    description: "Ideal para ambientes com pouca luz.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Seguir o sistema",
    description: "Troca junto com o seu dispositivo.",
    icon: Monitor,
  },
];

const subscribe = () => () => {};

/** True only after hydration, without setting state from an effect. */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemePreference() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const current = mounted ? theme ?? "system" : undefined;

  return (
    <fieldset>
      <legend className="text-[13px] font-semibold">Tema da interface</legend>
      <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
        Os dois temas usam o mesmo contraste mínimo e nunca dependem só de cor.
      </p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const checked = current === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-md border bg-surface px-3.5 py-3 transition-colors",
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
                <span className="text-[13px] font-semibold">
                  {option.label}
                </span>
              </span>
              <span className="text-[11.5px] leading-relaxed text-muted">
                {option.description}
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
        A preferência fica só neste dispositivo. O tema do sistema é usado
        quando “Seguir o sistema” está ativo.
      </p>
    </fieldset>
  );
}
