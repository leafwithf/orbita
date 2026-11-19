import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/modules/workspaces/domain";

export type WorkspaceMember = {
  userId: string;
  name: string;
  /** Só aparece para proprietário e administradores (decidido no banco). */
  email: string | null;
  role: WorkspaceRole;
  status: "active" | "suspended";
  joinedAt: string;
};

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_workspace_members", {
    p_workspace: workspaceId,
  });

  if (error) return [];

  return (
    (data ?? []) as {
      user_id: string;
      full_name: string | null;
      email: string | null;
      role: WorkspaceRole;
      status: "active" | "suspended";
      joined_at: string;
    }[]
  ).map((row) => ({
    userId: row.user_id,
    name: row.full_name || "Pessoa do espaço",
    email: row.email,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  }));
}
