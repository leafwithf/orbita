import type { NextRequest } from "next/server";
import { z } from "zod";

import { authorize, json } from "@/lib/files/http";

const querySchema = z.uuid();

export async function GET(request: NextRequest) {
  const auth = await authorize(request, { mutating: false });
  if ("error" in auth) return auth.error;
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!querySchema.safeParse(workspaceId).success) return json({ error: "requisicao_invalida" }, 400);

  const { data, error } = await auth.supabase
    .from("files_metadata")
    .select("id, file_name")
    .eq("workspace_id", workspaceId!)
    .eq("status", "ready")
    .is("deleted_at", null)
    .order("file_name", { ascending: true })
    .limit(1000);

  if (error) return json({ error: "falha_ao_listar" }, 500);
  return json({ files: (data ?? []).map((file) => ({ id: file.id, fileName: file.file_name })) });
}
