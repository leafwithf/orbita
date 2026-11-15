export const COURSE_STATUSES = [
  "planned",
  "in_progress",
  "paused",
  "completed",
] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  planned: "Planejado",
  in_progress: "Em andamento",
  paused: "Pausado",
  completed: "Concluído",
};

export function courseStatusLabel(status: string): string {
  return COURSE_STATUS_LABELS[status as CourseStatus] ?? "Planejado";
}
