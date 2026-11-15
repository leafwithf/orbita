import type { Progress } from "@/modules/tasks/domain";
import { calculateProgress } from "@/modules/tasks/domain";

export type ProgressRow = {
  project_id: string | null;
  weight: number;
  status: "todo" | "in_progress" | "done";
  parent_task_id: string | null;
};

/** Groups task rows by project and returns transparent weighted progress. */
export function progressByProject(
  rows: ProgressRow[],
): Map<string, Progress> {
  const grouped = new Map<string, ProgressRow[]>();

  for (const row of rows) {
    if (!row.project_id) continue;
    const list = grouped.get(row.project_id) ?? [];
    list.push(row);
    grouped.set(row.project_id, list);
  }

  const result = new Map<string, Progress>();
  for (const [projectId, tasks] of grouped) {
    result.set(
      projectId,
      calculateProgress(
        tasks.map((task) => ({
          weight: task.weight,
          status: task.status,
          parentTaskId: task.parent_task_id,
        })),
      ),
    );
  }

  return result;
}
