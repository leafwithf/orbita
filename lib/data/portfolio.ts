import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PortfolioListItem = {
  id: string;
  slug: string;
  summary: string | null;
  visibility: "private" | "unlisted" | "public";
  projectId: string;
  projectTitle: string;
  publishedAt: string | null;
  revokedAt: string | null;
};

export async function listPortfolioEntries(
  workspaceId: string,
): Promise<PortfolioListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_entries")
    .select(
      "id, slug, summary, visibility, project_id, published_at, revoked_at, projects(title)",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];

  return (
    (data ?? []) as unknown as {
      id: string;
      slug: string;
      summary: string | null;
      visibility: PortfolioListItem["visibility"];
      project_id: string;
      published_at: string | null;
      revoked_at: string | null;
      projects: { title: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    slug: row.slug,
    summary: row.summary,
    visibility: row.visibility,
    projectId: row.project_id,
    projectTitle: row.projects?.title ?? "Projeto",
    publishedAt: row.published_at,
    revokedAt: row.revoked_at,
  }));
}
