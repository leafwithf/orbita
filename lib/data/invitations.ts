import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/modules/workspaces/domain";

export type PendingInvitation = {
  id: string;
  role: WorkspaceRole;
  email: string | null;
  expiresAt: string;
  createdAt: string;
};

/** Convites ainda utilizáveis (RLS: só proprietário/admin enxergam). */
export async function listPendingInvitations(
  workspaceId: string,
): Promise<PendingInvitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, role, email, expires_at, created_at")
    .eq("workspace_id", workspaceId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return [];
  return (
    (data ?? []) as {
      id: string;
      role: WorkspaceRole;
      email: string | null;
      expires_at: string;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    role: row.role,
    email: row.email,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export type InvitationPreview = {
  workspaceName: string;
  role: WorkspaceRole;
  emailBound: boolean;
  emailMatches: boolean;
  state: "valid" | "used" | "revoked" | "expired";
  invitedByName: string | null;
};

export async function previewInvitation(
  tokenHash: string,
): Promise<InvitationPreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_invitation", {
    p_token_hash: tokenHash,
  });

  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        workspace_name: string;
        role: WorkspaceRole;
        email_bound: boolean;
        email_matches: boolean;
        state: InvitationPreview["state"];
        invited_by_name: string | null;
      }
    | undefined;

  if (error || !row) return null;
  return {
    workspaceName: row.workspace_name,
    role: row.role,
    emailBound: row.email_bound,
    emailMatches: row.email_matches,
    state: row.state,
    invitedByName: row.invited_by_name,
  };
}
