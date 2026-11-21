import "server-only";

import { createClient } from "@/lib/supabase/server";

export type FileListItem = {
  id: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  status: "pending" | "ready" | "quarantined" | "deleted";
  context: string | null;
  createdAt: string;
};

export type FileUsage = {
  usedBytes: number;
  limitBytes: number;
  count: number;
};

import { WORKSPACE_LIMIT_BYTES } from "@/modules/files/domain";

export const WORKSPACE_STORAGE_LIMIT_BYTES = WORKSPACE_LIMIT_BYTES;

export async function listFiles(
  workspaceId: string,
): Promise<{ files: FileListItem[]; usage: FileUsage }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files_metadata")
    .select("id, file_name, mime, size_bytes, status, entity_type, created_at")
    .eq("workspace_id", workspaceId)
    .in("status", ["pending", "ready", "quarantined"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return {
      files: [],
      usage: { usedBytes: 0, limitBytes: WORKSPACE_STORAGE_LIMIT_BYTES, count: 0 },
    };
  }

  const rows = (data ?? []) as {
    id: string;
    file_name: string;
    mime: string;
    size_bytes: number;
    status: FileListItem["status"];
    entity_type: string | null;
    created_at: string;
  }[];

  return {
    files: rows.map((row) => ({
      id: row.id,
      fileName: row.file_name,
      mime: row.mime,
      sizeBytes: row.size_bytes,
      status: row.status,
      context: row.entity_type,
      createdAt: row.created_at,
    })),
    usage: {
      usedBytes: rows
        .filter((row) => row.status !== "quarantined")
        .reduce((sum, row) => sum + Number(row.size_bytes), 0),
      limitBytes: WORKSPACE_STORAGE_LIMIT_BYTES,
      count: rows.length,
    },
  };

export type ProjectFileItem = {
  id: string;
  fileName: string;
  mime: string;
  sizeBytes: number;
  status: "pending" | "ready" | "quarantined";
  createdAt: string;
  authorName: string;
};

export async function listProjectFiles(input: {
  workspaceId: string;
  projectId: string;
}): Promise<ProjectFileItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files_metadata")
    .select("id, file_name, mime, size_bytes, status, created_at, profiles:created_by(full_name)")
    .eq("workspace_id", input.workspaceId)
    .eq("entity_type", "project")
    .eq("entity_id", input.projectId)
    .in("status", ["pending", "ready", "quarantined"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string } | null;
    return {
      id: row.id,
      fileName: row.file_name,
      mime: row.mime,
      sizeBytes: Number(row.size_bytes),
      status: row.status as ProjectFileItem["status"],
      createdAt: row.created_at,
      authorName: profile?.full_name || "Pessoa do espaço",
    };
  });
}
