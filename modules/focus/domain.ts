export const FOCUS_KINDS = ["project", "course"] as const;

export type FocusKind = (typeof FOCUS_KINDS)[number];
export type FocusScope = "workspace" | "user";

export const FOCUS_KIND_LABELS: Record<FocusKind, string> = {
  project: "projeto",
  course: "curso",
};

/**
 * The scope key is what makes the unique constraint work for both workspace
 * and per-user focus without a boolean flag.
 */
export function resolveFocusScopeKey(
  scope: FocusScope,
  userId: string,
): string {
  return scope === "user" ? userId : "workspace";
}

export function assertFocusKind(value: string): FocusKind {
  if (!(FOCUS_KINDS as readonly string[]).includes(value)) {
    throw new Error(`Tipo de foco inválido: ${value}`);
  }
  return value as FocusKind;
}

export function focusChangePrompt(
  kind: FocusKind,
  currentTitle: string | null,
  nextTitle: string,
): string {
  const noun = FOCUS_KIND_LABELS[kind];

  if (!currentTitle) {
    return `Definir “${nextTitle}” como ${noun} principal? Você poderá trocar depois.`;
  }

  return `Trocar o ${noun} principal de “${currentTitle}” para “${nextTitle}”? Nada será arquivado ou apagado.`;
}
