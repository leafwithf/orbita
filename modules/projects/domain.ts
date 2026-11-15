export const PROJECT_STAGES = [
  "idea",
  "research",
  "planning",
  "design",
  "build",
  "review",
  "launch",
  "follow_up",
  "done",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  idea: "Ideia",
  research: "Pesquisa",
  planning: "Planejamento",
  design: "Design",
  build: "Construção",
  review: "Revisão",
  launch: "Lançamento",
  follow_up: "Acompanhamento",
  done: "Concluído",
};

export function projectStageLabel(stage: string): string {
  return PROJECT_STAGE_LABELS[stage as ProjectStage] ?? "Em andamento";
}

export function projectStagePosition(stage: string): number {
  const index = PROJECT_STAGES.indexOf(stage as ProjectStage);
  return index < 0 ? 1 : index + 1;
}

export const PROJECT_STATUSES = ["active", "paused", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Em andamento",
  paused: "Pausado",
  completed: "Concluído",
};

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Baixa",
  medium: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

export function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority as Priority] ?? "Normal";
}
