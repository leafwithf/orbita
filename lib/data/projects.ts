import "server-only";

import { createClient } from "@/lib/supabase/server";
import { progressByProject, type ProgressRow } from "@/lib/data/progress";
import { calculateProgress, classifyDueDate } from "@/modules/tasks/domain";
import type { DueDateState } from "@/modules/tasks/domain";
import { projectStagePosition } from "@/modules/projects/domain";

export type ProjectListItem = {
  id: string;
  title: string;
  emoji: string;
  coverUrl: string | null;
  objective: string | null;
  nextStep: string | null;
  stage: string;
  stagePosition: number;
  status: "active" | "paused" | "completed";
  dueDate: string | null;
  dueState: DueDateState;
  progress: ReturnType<typeof calculateProgress>;
};

type ProjectRow = {
  id: string;
  title: string;
  emoji: string;
  cover_url: string | null;
  objective: string | null;
  next_step: string | null;
  stage: string;
  status: "active" | "paused" | "completed";
  due_date: string | null;
};

const PROJECT_SELECT =
  "id, title, emoji, cover_url, objective, next_step, stage, status, due_date";

function toProject(
  row: ProjectRow,
  progress: Map<string, ReturnType<typeof calculateProgress>>,
  today: string,
): ProjectListItem {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji || "🚀",
    coverUrl: row.cover_url,
    objective: row.objective,
    nextStep: row.next_step,
    stage: row.stage,
    stagePosition: projectStagePosition(row.stage),
    status: row.status,
    dueDate: row.due_date,
    dueState: classifyDueDate(row.due_date, today),
    progress: progress.get(row.id) ?? calculateProgress([]),
  };
}

export async function listProjects({
  workspaceId,
  today,
}: {
  workspaceId: string;
  today: string;
}): Promise<ProjectListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return [];

  const rows = (data ?? []) as ProjectRow[];
  if (rows.length === 0) return [];

  const { data: progressRows } = await supabase
    .from("tasks")
    .select("project_id, weight, status, parent_task_id")
    .eq("workspace_id", workspaceId)
    .in(
      "project_id",
      rows.map((row) => row.id),
    )
    .is("deleted_at", null);

  const progress = progressByProject((progressRows ?? []) as ProgressRow[]);
  return rows.map((row) => toProject(row, progress, today));
}

export type ProjectDetail = ProjectListItem & {
  ownerId: string | null;
  description: string | null;
  risks: string | null;
  startDate: string | null;
  createdAt: string;
};

export async function getProjectDetail({
  workspaceId,
  projectId,
  today,
}: {
  workspaceId: string;
  projectId: string;
  today: string;
}): Promise<ProjectDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, emoji, cover_url, objective, next_step, stage, status, due_date, description, risks, start_date, created_at, owner_id, created_by",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle<ProjectRow & {
      description: string | null;
      risks: string | null;
      start_date: string | null;
      created_at: string;
      owner_id: string | null;
      created_by: string | null;
    }>();

  if (error || !data) return null;

  const { data: progressRows } = await supabase
    .from("tasks")
    .select("project_id, weight, status, parent_task_id")
    .eq("workspace_id", workspaceId)
    .eq("project_id", projectId)
    .is("deleted_at", null);

  const progress = progressByProject((progressRows ?? []) as ProgressRow[]);

  return {
    ...toProject(data, progress, today),
    ownerId: data.owner_id ?? data.created_by,
    description: data.description,
    risks: data.risks,
    startDate: data.start_date,
    createdAt: data.created_at,
  };
}
