import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DueDateState } from "@/modules/tasks/domain";
import { classifyDueDate } from "@/modules/tasks/domain";

export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  dueState: DueDateState;
  priority: string;
  status: "todo" | "in_progress" | "done";
  projectId: string | null;
  projectTitle: string | null;
  assigneeName: string | null;
  completedAt: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: "todo" | "in_progress" | "done";
  project_id: string | null;
  completed_at: string | null;
  projects: { title: string } | null;
  assignee: { full_name: string } | null;
};

const TASK_SELECT =
  "id, title, description, due_date, priority, status, project_id, completed_at, projects(title), assignee:profiles!tasks_assignee_id_fkey(full_name)";

function toTask(row: TaskRow, today: string): TaskListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    dueState: classifyDueDate(row.due_date, today),
    priority: row.priority,
    status: row.status,
    projectId: row.project_id,
    projectTitle: row.projects?.title ?? null,
    assigneeName: row.assignee?.full_name ?? null,
    completedAt: row.completed_at,
  };
}

export async function listTasks({
  workspaceId,
  today,
  includeDone = false,
  projectId,
}: {
  workspaceId: string;
  today: string;
  includeDone?: boolean;
  projectId?: string;
}): Promise<TaskListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  if (projectId) query = query.eq("project_id", projectId);
  if (!includeDone) query = query.neq("status", "done");

  const { data, error } = await query
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return [];
  return ((data ?? []) as unknown as TaskRow[]).map((row) =>
    toTask(row, today),
  );
}

export async function getTaskById({
  workspaceId,
  taskId,
  today,
}: {
  workspaceId: string;
  taskId: string;
  today: string;
}): Promise<TaskListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", taskId)
    .is("deleted_at", null)
    .maybeSingle<TaskRow>();

  if (error || !data) return null;
  return toTask(data, today);
}

export type KanbanTask = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  position: number;
  priority: string;
  dueDate: string | null;
  dueState: DueDateState;
  projectTitle: string | null;
};

/** Quadro: abertas + concluídas nos últimos 14 dias, já ordenadas por posição. */
export async function listKanbanTasks({
  workspaceId,
  today,
  projectId,
}: {
  workspaceId: string;
  today: string;
  projectId?: string;
}): Promise<KanbanTask[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from("tasks")
    .select("id, title, status, position, priority, due_date, projects(title)")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null)
    .or(`status.neq.done,completed_at.gte.${since}`);

  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(300);

  if (error) return [];
  return (
    (data ?? []) as unknown as {
      id: string;
      title: string;
      status: KanbanTask["status"];
      position: number | string;
      priority: string;
      due_date: string | null;
      projects: { title: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    position: Number(row.position),
    priority: row.priority,
    dueDate: row.due_date,
    dueState: classifyDueDate(row.due_date, today),
    projectTitle: row.projects?.title ?? null,
  }));
}

export type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: string;
  dueDate: string | null;
  dueState: DueDateState;
  projectId: string | null;
  projectTitle: string | null;
  assigneeId: string | null;
  createdBy: string | null;
};

export async function getTaskDetail({
  workspaceId,
  taskId,
  today,
}: {
  workspaceId: string;
  taskId: string;
  today: string;
}): Promise<TaskDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, due_date, project_id, assignee_id, created_by, projects(title)",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", taskId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    title: string;
    description: string | null;
    status: TaskDetail["status"];
    priority: string;
    due_date: string | null;
    project_id: string | null;
    assignee_id: string | null;
    created_by: string | null;
    projects: { title: string } | null;
  };

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    dueState: classifyDueDate(row.due_date, today),
    projectId: row.project_id,
    projectTitle: row.projects?.title ?? null,
    assigneeId: row.assignee_id,
    createdBy: row.created_by,
  };
}
