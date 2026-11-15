export type DueDateState = "overdue" | "today" | "upcoming" | "none";

export const DUE_DATE_LABELS: Record<DueDateState, string> = {
  overdue: "Atrasada",
  today: "Vence hoje",
  upcoming: "Próxima",
  none: "Sem prazo",
};

function toUtcDay(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * Due dates are calendar dates (not instants) to avoid the "was it due at 9pm
 * yesterday?" problem across time zones. `today` must already be the user's
 * local calendar date in ISO form.
 */
export function classifyDueDate(
  dueDate: string | null,
  today: string,
): DueDateState {
  if (!dueDate) return "none";

  const due = toUtcDay(dueDate);
  const reference = toUtcDay(today);

  if (due < reference) return "overdue";
  if (due === reference) return "today";
  return "upcoming";
}

export function dueDateLabel(dueDate: string | null, today: string): string {
  return DUE_DATE_LABELS[classifyDueDate(dueDate, today)];
}

export type ProgressTask = {
  weight: number;
  status: "todo" | "in_progress" | "done" | "archived";
  parentTaskId?: string | null;
};

export type Progress = {
  completedWeight: number;
  totalWeight: number;
  percent: number;
  label: string;
};

/**
 * Transparent progress: weighted leaves only, archived tasks excluded, never a
 * colour-only signal. The UI always renders `label`.
 */
export function calculateProgress(tasks: ProgressTask[]): Progress {
  const active = tasks.filter(
    (task) => task.status !== "archived" && !task.parentTaskId,
  );
  const totalWeight = active.reduce(
    (sum, task) => sum + Math.max(task.weight, 1),
    0,
  );
  const completedWeight = active
    .filter((task) => task.status === "done")
    .reduce((sum, task) => sum + Math.max(task.weight, 1), 0);

  const percent =
    totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100);

  return {
    completedWeight,
    totalWeight,
    percent,
    label:
      totalWeight === 0
        ? "Sem tarefas ainda"
        : `${completedWeight} de ${totalWeight} tarefas (${percent}%)`,
  };
}
