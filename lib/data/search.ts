import "server-only";

import { createClient } from "@/lib/supabase/server";
import { normalizeSearchQuery } from "@/modules/tasks/kanban";

export type SearchHit = {
  entityType: "idea" | "project" | "task" | "course";
  id: string;
  title: string;
  snippet: string;
};

export async function searchWorkspace(
  workspaceId: string,
  rawQuery: string,
): Promise<SearchHit[]> {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_workspace", {
    p_workspace: workspaceId,
    p_query: query,
    p_limit: 30,
  });

  if (error) return [];
  return (
    (data ?? []) as {
      entity_type: SearchHit["entityType"];
      id: string;
      title: string;
      snippet: string | null;
    }[]
  ).map((row) => ({
    entityType: row.entity_type,
    id: row.id,
    title: row.title,
    snippet: row.snippet ?? "",
  }));
}

export type TrashedItem = {
  kind: "projects" | "tasks" | "ideas" | "courses" | "files";
  id: string;
  title: string;
  deletedAt: string;
};

const TRASH_TABLES = ["projects", "tasks", "ideas", "courses", "files"] as const;

export async function listTrash(workspaceId: string): Promise<TrashedItem[]> {
  const supabase = await createClient();
  const lists = await Promise.all(
    TRASH_TABLES.map(async (kind) => {
      const table = kind === "files" ? "files_metadata" : kind;
      const columns = kind === "files" ? "id, title:file_name, deleted_at" : "id, title, deleted_at";
      const { data } = await supabase
        .from(table)
        .select(columns)
        .eq("workspace_id", workspaceId)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(50);
      return ((data ?? []) as unknown as { id: string; title: string; deleted_at: string }[]).map(
        (row): TrashedItem => ({
          kind,
          id: row.id,
          title: row.title,
          deletedAt: row.deleted_at,
        }),
      );
    }),
  );
  return lists
    .flat()
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
    .slice(0, 80);
}
