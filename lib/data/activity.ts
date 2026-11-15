import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ActivityItem = {
  id: string;
  verb: string;
  entityType: string;
  entityId: string | null;
  title: string | null;
  actorId: string | null;
  createdAt: string;
};

export async function listActivity(
  workspaceId: string,
  limit = 60,
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("id, verb, entity_type, entity_id, actor_id, metadata, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (
    (data ?? []) as {
      id: string;
      verb: string;
      entity_type: string;
      entity_id: string | null;
      actor_id: string | null;
      metadata: { title?: string } | null;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    verb: row.verb,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.metadata?.title ?? null,
    actorId: row.actor_id,
    createdAt: row.created_at,
  }));
}
