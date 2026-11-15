import type { WorkspaceRole } from "@/modules/workspaces/domain";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  kind: "personal" | "team" | "client";
  focus_scope: "workspace" | "user";
  role: WorkspaceRole;
};

/**
 * Foundation shortcut: the first workspace the user belongs to. Etapa 4 adds a
 * workspace switcher and a persisted selection.
 */
export async function getCurrentWorkspace(
  userId: string,
): Promise<WorkspaceSummary | null> {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "role, workspaces!inner(id, name, slug, kind, focus_scope, created_at)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { referencedTable: "workspaces", ascending: true })
    .limit(1)
    .maybeSingle<{
      role: WorkspaceRole;
      workspaces: {
        id: string;
        name: string;
        slug: string;
        kind: "personal" | "team" | "client";
        focus_scope: "workspace" | "user";
      };
    }>();

  if (error || !data) {
    return null;
  }

  return {
    id: data.workspaces.id,
    name: data.workspaces.name,
    slug: data.workspaces.slug,
    kind: data.workspaces.kind,
    focus_scope: data.workspaces.focus_scope,
    role: data.role,
  };
}
