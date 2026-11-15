import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DueDateState } from "@/modules/tasks/domain";
import { classifyDueDate } from "@/modules/tasks/domain";

export type CourseListItem = {
  id: string;
  title: string;
  platform: string | null;
  url: string | null;
  objective: string | null;
  status: "planned" | "in_progress" | "paused" | "completed";
  progress: number;
  nextLesson: string | null;
  dueDate: string | null;
  dueState: DueDateState;
  moduleCount: number;
  doneModules: number;
};

type CourseRow = {
  id: string;
  title: string;
  platform: string | null;
  url: string | null;
  objective: string | null;
  status: "planned" | "in_progress" | "paused" | "completed";
  progress: number;
  next_lesson: string | null;
  due_date: string | null;
  course_modules: { id: string; done_at: string | null }[] | null;
};

export async function listCourses({
  workspaceId,
  today,
}: {
  workspaceId: string;
  today: string;
}): Promise<CourseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, platform, url, objective, status, progress, next_lesson, due_date, course_modules(id, done_at)",
    )
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return [];

  return ((data ?? []) as unknown as CourseRow[]).map((row) => {
    const modules = row.course_modules ?? [];
    return {
      id: row.id,
      title: row.title,
      platform: row.platform,
      url: row.url,
      objective: row.objective,
      status: row.status,
      progress: row.progress,
      nextLesson: row.next_lesson,
      dueDate: row.due_date,
      dueState: classifyDueDate(row.due_date, today),
      moduleCount: modules.length,
      doneModules: modules.filter((module) => module.done_at).length,
    };
  });
}
