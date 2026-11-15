import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { FocusScope } from "@/modules/focus/domain";

export type FocusState = {
  projectId: string | null;
  courseId: string | null;
  scopeKey: string;
};

export async function getFocusState({
  workspaceId,
  userId,
  focusScope,
}: {
  workspaceId: string;
  userId: string;
  focusScope: FocusScope;
}): Promise<FocusState> {
  const scopeKey = focusScope === "user" ? userId : "workspace";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("focus_assignments")
    .select("kind, target_id, scope_key")
    .eq("workspace_id", workspaceId);

  if (error) {
    return { projectId: null, courseId: null, scopeKey };
  }

  const rows = (data ?? []) as {
    kind: "project" | "course";
    target_id: string;
    scope_key: string;
  }[];

  return {
    projectId:
      rows.find(
        (row) => row.kind === "project" && row.scope_key === scopeKey,
      )?.target_id ?? null,
    courseId:
      rows.find((row) => row.kind === "course" && row.scope_key === scopeKey)
        ?.target_id ?? null,
    scopeKey,
  };
}
