import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { authorize, BUCKET, json } from "@/lib/files/http";
import { isInlinePreviewable, SIGNED_READ_TTL_SECONDS } from "@/modules/files/domain";

/** GET /api/files/{id}/url — redireciona para uma URL assinada de 5 minutos. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize(request, { mutating: false });
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return json({ error: "id_invalido" }, 400);

  const { data: file } = await auth.supabase
    .from("files_metadata")
    .select("storage_path, file_name, mime, status")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!file || file.status !== "ready") return json({ error: "nao_encontrado" }, 404);

  const forceDownload = request.nextUrl.searchParams.get("baixar") === "1";
  const download = forceDownload || !isInlinePreviewable(file.mime) ? file.file_name : undefined;

  const signed = await auth.supabase.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_READ_TTL_SECONDS, download ? { download } : undefined);
  if (signed.error || !signed.data) return json({ error: "storage_indisponivel" }, 502);

  const redirect = NextResponse.redirect(signed.data.signedUrl, 302);
  redirect.headers.set("Cache-Control", "no-store");
  redirect.headers.set("Referrer-Policy", "no-referrer");
  return redirect;
}
