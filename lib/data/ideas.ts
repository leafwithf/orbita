import "server-only";

import { createClient } from "@/lib/supabase/server";

export type IdeaListItem = {
  id: string;
  title: string;
  body: string | null;
  state: "new" | "evaluating" | "validated" | "not_prioritized" | "converted";
  potential: "low" | "medium" | "high" | null;
  createdAt: string;
  convertedProjectId: string | null;
};

export async function listIdeas(
  workspaceId: string,
): Promise<IdeaListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("id, title, body, state, potential, created_at, converted_project_id")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];

  return (
    (data ?? []) as {
      id: string;
      title: string;
      body: string | null;
      state: IdeaListItem["state"];
      potential: IdeaListItem["potential"];
      created_at: string;
      converted_project_id: string | null;
    }[]
  ).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    state: row.state,
    potential: row.potential,
    createdAt: row.created_at,
    convertedProjectId: row.converted_project_id,
  }));
}
