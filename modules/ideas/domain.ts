export const IDEA_STATES = [
  "new",
  "evaluating",
  "validated",
  "not_prioritized",
  "converted",
] as const;

export type IdeaState = (typeof IDEA_STATES)[number];

export const IDEA_STATE_LABELS: Record<IdeaState, string> = {
  new: "Nova",
  evaluating: "Avaliando",
  validated: "Validada",
  not_prioritized: "Não priorizada",
  converted: "Virou projeto",
};

export function ideaStateLabel(state: string): string {
  return IDEA_STATE_LABELS[state as IdeaState] ?? "Nova";
}
