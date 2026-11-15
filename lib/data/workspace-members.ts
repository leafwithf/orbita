import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/modules/workspaces/domain";

export type WorkspaceMember = {
  userId: string;
  name: string;
  email: string | null;
  role: WorkspaceRole;
  status: "active" | "suspended";
  joinedAt: string;
};

/**
 * `profiles` is readable for people who share a workspace (RLS), so member
 * names resolve without service-role access. Email is intentionally not
 * exposed by profiles; Etapa 6 adds a safe directory view.
 */
export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, status, created_at, profiles(full_name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return [];

  return (
    (data ?? []) as unknown as {
      user_id: string;
      role: WorkspaceRole;
      status: "active" | "suspended";
      created_at: string;
      profiles: { full_name: string } | null;
    }[]
  ).map((row) => ({
    userId: row.user_id,
    name: row.profiles?.full_name || "Pessoa do espaço",
    email: null,
    role: row.role,
    status: row.status,
    joinedAt: row.created_at,
  }));
}
