import "server-only";

import { createClient } from "@/lib/supabase/server";
import { startOfWeekIso } from "@/lib/dates";
import type { DueDateState, Progress } from "@/modules/tasks/domain";
import { calculateProgress, classifyDueDate } from "@/modules/tasks/domain";
import { projectStagePosition } from "@/modules/projects/domain";
import type { FocusScope } from "@/modules/focus/domain";
import { progressByProject, type ProgressRow } from "@/lib/data/progress";

export type DashboardTask = {
  id: string;
  title: string;
  dueDate: string | null;
  dueState: DueDateState;
  priority: string;
  projectTitle: string | null;
};

export type DashboardProject = {
  id: string;
  title: string;
  objective: string | null;
  nextStep: string | null;
  stage: string;
  stagePosition: number;
  dueDate: string | null;
  dueState: DueDateState;
  progress: Progress;
};

export type DashboardCourse = {
  id: string;
  title: string;
  platform: string | null;
  progress: number;
  nextLesson: string | null;
  dueDate: string | null;
};

export type UpcomingDeadline = {
  id: string;
  title: string;
  date: string;
  context: string | null;
  kind: "task" | "project" | "course";
};

export type ActivityItem = {
  id: string;
  verb: string;
  entityType: string;
  actorName: string | null;
  createdAt: string;
};

export type DashboardData = {
  focusProject: DashboardProject | null;
  focusCourse: DashboardCourse | null;
  todayTasks: DashboardTask[];
  overdueTasks: DashboardTask[];
  upcomingTasks: DashboardTask[];
  projects: DashboardProject[];
  deadlines: UpcomingDeadline[];
  activity: ActivityItem[];
  stats: {
    openCount: number;
    overdueCount: number;
    completedThisWeek: number;
    createdThisWeek: number;
  };
};

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
  project_id: string | null;
  projects: { title: string } | null;
};

type ProjectRow = {
  id: string;
  title: string;
  objective: string | null;
  next_step: string | null;
  stage: string;
  due_date: string | null;
};

function toDashboardTask(
  row: TaskRow,
  today: string,
): DashboardTask {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    dueState: classifyDueDate(row.due_date, today),
    priority: row.priority,
    projectTitle: row.projects?.title ?? null,
  };
}

/**
 * Everything the overview needs, in a fixed number of queries. Missing tables
 * (before migrations run) degrade to empty states instead of crashing.
 */
export async function getDashboardData({
  workspaceId,
  userId,
  today,
  focusScope,
}: {
  workspaceId: string;
  userId: string;
  today: string;
  focusScope: FocusScope;
}): Promise<DashboardData> {
  const supabase = await createClient();
  const weekStart = startOfWeekIso(today);
  const weekStartIso = `${weekStart}T00:00:00.000Z`;

  const [tasksResult, projectsResult, focusResult, completedResult, createdResult, activityResult] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id, title, due_date, priority, status, project_id, projects(title)",
        )
        .eq("workspace_id", workspaceId)
        .neq("status", "done")
        .is("deleted_at", null)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(80),
      supabase
        .from("projects")
        .select("id, title, objective, next_step, stage, due_date")
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase
        .from("focus_assignments")
        .select("kind, target_id, scope_key")
        .eq("workspace_id", workspaceId),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "done")
        .gte("completed_at", weekStartIso)
        .is("deleted_at", null),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gte("created_at", weekStartIso)
        .is("deleted_at", null),
      supabase
        .from("activity_events")
        .select("id, verb, entity_type, created_at, actor:profiles(full_name)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const taskRows = (tasksResult.data ?? []) as unknown as TaskRow[];
  const projectRows = (projectsResult.data ?? []) as unknown as ProjectRow[];
  const scopeKey = focusScope === "user" ? userId : "workspace";
  const focusRows = (focusResult.data ?? []) as {
    kind: "project" | "course";
    target_id: string;
    scope_key: string;
  }[];
  const focusProjectId =
    focusRows.find(
      (row) => row.kind === "project" && row.scope_key === scopeKey,
    )?.target_id ?? null;
  const focusCourseId =
    focusRows.find(
      (row) => row.kind === "course" && row.scope_key === scopeKey,
    )?.target_id ?? null;

  const projectIds = projectRows.map((project) => project.id);
  if (focusProjectId && !projectIds.includes(focusProjectId)) {
    projectIds.push(focusProjectId);
  }

  const progressResult = projectIds.length
    ? await supabase
        .from("tasks")
        .select("project_id, weight, status, parent_task_id")
        .eq("workspace_id", workspaceId)
        .in("project_id", projectIds)
        .is("deleted_at", null)
    : { data: [] as ProgressRow[] };

  const progress = progressByProject(
    (progressResult.data ?? []) as ProgressRow[],
  );

  const projectById = new Map(projectRows.map((row) => [row.id, row]));
  if (focusProjectId && !projectById.has(focusProjectId)) {
    const { data } = await supabase
      .from("projects")
      .select("id, title, objective, next_step, stage, due_date")
      .eq("id", focusProjectId)
      .eq("workspace_id", workspaceId)
      .maybeSingle<ProjectRow>();
    if (data) projectById.set(data.id, data);
  }

  const toProject = (row: ProjectRow): DashboardProject => ({
    id: row.id,
    title: row.title,
    objective: row.objective,
    nextStep: row.next_step,
    stage: row.stage,
    stagePosition: projectStagePosition(row.stage),
    dueDate: row.due_date,
    dueState: classifyDueDate(row.due_date, today),
    progress: progress.get(row.id) ?? calculateProgress([]),
  });

  const projects = projectRows.map(toProject);
  const focusProjectRow = focusProjectId
    ? projectById.get(focusProjectId) ?? null
    : null;

  let focusCourse: DashboardCourse | null = null;
  if (focusCourseId) {
    const { data } = await supabase
      .from("courses")
      .select("id, title, platform, progress, next_lesson, due_date")
      .eq("id", focusCourseId)
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .maybeSingle<{
        id: string;
        title: string;
        platform: string | null;
        progress: number;
        next_lesson: string | null;
        due_date: string | null;
      }>();

    if (data) {
      focusCourse = {
        id: data.id,
        title: data.title,
        platform: data.platform,
        progress: data.progress,
        nextLesson: data.next_lesson,
        dueDate: data.due_date,
      };
    }
  }

  const tasks = taskRows.map((row) => toDashboardTask(row, today));
  const todayTasks = tasks.filter((task) => task.dueState === "today");
  const overdueTasks = tasks.filter((task) => task.dueState === "overdue");
  const upcomingTasks = tasks.filter((task) => task.dueState === "upcoming");

  const deadlines: UpcomingDeadline[] = [
    ...tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        date: task.dueDate as string,
        context: task.projectTitle,
        kind: "task" as const,
      })),
    ...projectRows
      .filter((project) => project.due_date)
      .map((project) => ({
        id: `project-${project.id}`,
        title: project.title,
        date: project.due_date as string,
        context: "Projeto",
        kind: "project" as const,
      })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const activity = (
    (activityResult.data ?? []) as unknown as {
      id: string;
      verb: string;
      entity_type: string;
      created_at: string;
      actor: { full_name: string } | null;
    }[]
  ).map((item) => ({
    id: item.id,
    verb: item.verb,
    entityType: item.entity_type,
    actorName: item.actor?.full_name ?? null,
    createdAt: item.created_at,
  }));

  return {
    focusProject: focusProjectRow ? toProject(focusProjectRow) : null,
    focusCourse,
    todayTasks,
    overdueTasks,
    upcomingTasks,
    projects,
    deadlines,
    activity,
    stats: {
      openCount: tasks.length,
      overdueCount: overdueTasks.length,
      completedThisWeek: completedResult.count ?? 0,
      createdThisWeek: createdResult.count ?? 0,
    },
  };
}
