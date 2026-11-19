import { cache } from "react";
import { cookies } from "next/headers";

import type { WorkspaceRole } from "@/modules/workspaces/domain";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const WORKSPACE_COOKIE = "orbita_workspace";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  kind: "personal" | "team" | "client";
  focus_scope: "workspace" | "user";
  role: WorkspaceRole;
};

type MembershipRow = {
  role: WorkspaceRole;
  workspaces: {
    id: string;
    name: string;
    slug: string;
    kind: WorkspaceSummary["kind"];
    focus_scope: WorkspaceSummary["focus_scope"];
    created_at: string;
  };
};

/** Todos os espaços ativos da pessoa, do mais antigo para o mais novo. */
export const listMyWorkspaces = cache(
  async (userId: string): Promise<WorkspaceSummary[]> => {
    if (!getSupabaseConfig()) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workspace_members")
      .select(
        "role, workspaces!inner(id, name, slug, kind, focus_scope, created_at, deleted_at)",
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .is("workspaces.deleted_at", null)
      .limit(50);

    if (error || !data) return [];

    return (data as unknown as MembershipRow[])
      .sort((a, b) => a.workspaces.created_at.localeCompare(b.workspaces.created_at))
      .map((row) => ({
        id: row.workspaces.id,
        name: row.workspaces.name,
        slug: row.workspaces.slug,
        kind: row.workspaces.kind,
        focus_scope: row.workspaces.focus_scope,
        role: row.role,
      }));
  },
);

/**
 * O espaço escolhido (cookie) se a pessoa ainda for membro ativo dele; senão o
 * mais antigo. O cookie é só uma preferência: a permissão vem sempre do banco.
 */
export async function getCurrentWorkspace(
  userId: string,
): Promise<WorkspaceSummary | null> {
  const workspaces = await listMyWorkspaces(userId);
  if (workspaces.length === 0) return null;

  const wanted = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  return workspaces.find((workspace) => workspace.id === wanted) ?? workspaces[0];
}
