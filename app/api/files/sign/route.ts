import type { NextRequest } from "next/server";
import { z } from "zod";

import { authorize, BUCKET, json } from "@/lib/files/http";
import { SIGNED_UPLOAD_TTL_SECONDS, validateUploadRequest } from "@/modules/files/domain";

const bodySchema = z.object({
  workspaceId: z.uuid(),
  name: z.string().max(400),
  size: z.number(),
  mime: z.string().max(150),
  entityType: z.enum(["project", "task", "course", "idea"]).nullable().optional(),
  entityId: z.uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authorize(request, { mutating: true });
  if ("error" in auth) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "requisicao_invalida" }, 400);

  const check = validateUploadRequest(parsed.data);
  if (!check.ok) return json({ error: check.code, message: check.message }, 422);

  const { data, error } = await auth.supabase.rpc("begin_file_upload", {
    p_workspace: parsed.data.workspaceId,
    p_name: check.name,
    p_size: parsed.data.size,
    p_mime: check.mime,
    p_entity_type: parsed.data.entityType ?? null,
    p_entity_id: parsed.data.entityId ?? null,
  });

  if (error) {
    if (error.code === "53400") {
      return json({ error: "quota_exceeded", message: "O espaço atingiu o limite de 1 GB." }, 413);
    }
    if (error.code === "42501") return json({ error: "sem_permissao" }, 403);
    if (error.code === "22023") return json({ error: "arquivo_invalido" }, 422);
    return json({ error: "falha_ao_iniciar" }, 500);
  }

  const row = (Array.isArray(data) ? data[0] : data) as { id: string; storage_path: string } | undefined;
  if (!row) return json({ error: "falha_ao_iniciar" }, 500);

  const signed = await auth.supabase.storage.from(BUCKET).createSignedUploadUrl(row.storage_path);
  if (signed.error || !signed.data) {
    // Sem URL, o registro pendente não serve: sai da cota agora (o expurgo remove depois).
    await auth.supabase
      .from("files_metadata")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "pending");
    return json({ error: "storage_indisponivel" }, 502);
  }

  return json({
    fileId: row.id,
    signedUrl: signed.data.signedUrl,
    expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS,
  });
}
