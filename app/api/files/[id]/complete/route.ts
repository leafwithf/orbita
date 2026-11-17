import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { authorize, BUCKET, json } from "@/lib/files/http";
import { MAX_FILE_BYTES, verifyUploadedObject } from "@/modules/files/domain";

const HEAD_BYTES = 4096;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(request, { mutating: true });
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return json({ error: "id_invalido" }, 400);

  const { data: file } = await auth.supabase
    .from("files_metadata")
    .select("id, storage_path, mime, size_bytes, status")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!file) return json({ error: "nao_encontrado" }, 404);
  if (file.status !== "pending") return json({ error: "ja_finalizado", status: file.status }, 409);

  const signed = await auth.supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 60);
  if (signed.error || !signed.data) return json({ error: "storage_indisponivel" }, 502);

  const response = await fetch(signed.data.signedUrl);
  if (!response.ok || !response.body) return json({ error: "envio_nao_encontrado" }, 409);

  // Lê o objeto uma única vez: conta bytes, guarda o início e calcula o SHA-256.
  const hash = createHash("sha256");
  const reader = response.body.getReader();
  const head = new Uint8Array(HEAD_BYTES);
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (total < HEAD_BYTES) head.set(value.subarray(0, HEAD_BYTES - total), total);
    total += value.byteLength;
    hash.update(value);
    if (total > MAX_FILE_BYTES + 1) {
      await reader.cancel();
      break;
    }
  }

  const verdict = verifyUploadedObject({
    declaredMime: file.mime,
    declaredSize: Number(file.size_bytes),
    actualSize: total,
    head: head.subarray(0, Math.min(total, HEAD_BYTES)),
  });

  const { data: status, error } = await auth.supabase.rpc("finalize_file_upload", {
    p_file: id,
    p_ok: verdict.ok,
    p_checksum: verdict.ok ? hash.digest("hex") : null,
    p_reason: verdict.ok ? null : verdict.reason,
  });

  if (error) return json({ error: "falha_ao_finalizar" }, error.code === "23514" ? 409 : 500);
  return json({
    status,
    message: verdict.ok ? undefined : "O arquivo não confere com o tipo informado e ficou em análise.",
  });
}
