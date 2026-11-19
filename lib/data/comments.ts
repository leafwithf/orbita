import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CommentItem = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  edited: boolean;
};

export type CommentEntity = "project" | "task" | "course" | "idea" | "file";

export async function listComments(input: {
  workspaceId: string;
  entityType: CommentEntity;
  entityId: string;
}): Promise<CommentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, author_id, edited_at, created_at, profiles(full_name)")
    .eq("workspace_id", input.workspaceId)
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return [];
  return (
    (data ?? []) as unknown as {
      id: string;
      body: string;
      author_id: string;
      edited_at: string | null;
      created_at: string;
      profiles: { full_name: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    body: row.body,
    authorId: row.author_id,
    authorName: row.profiles?.full_name || "Pessoa do espaço",
    createdAt: row.created_at,
    edited: row.edited_at !== null,
  }));
}
