import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import { BUCKET, json } from "@/lib/files/http";

/**
 * Limpeza diária: lixeira com mais de 30 dias e uploads pendentes há mais de 24 h.
 * Protegida por CRON_SECRET (Authorization: Bearer ...). Usa a service role só aqui.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 24 || !url || !serviceKey) {
    return json({ error: "nao_configurado" }, 503);
  }

  const provided = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return json({ error: "nao_autorizado" }, 401);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc("list_expired_files");
  if (error) return json({ error: "falha_ao_listar" }, 500);

  const expired = (data ?? []) as { id: string; storage_path: string }[];
  if (expired.length === 0) return json({ removed: 0 });

  // Fase 1: remove objetos. Fase 2: só então apaga os registros dos que saíram do Storage.
  const { error: removeError } = await admin.storage.from(BUCKET).remove(expired.map((f) => f.storage_path));
  if (removeError) return json({ error: "falha_ao_remover_objetos" }, 502);

  const { data: count, error: deleteError } = await admin.rpc("delete_purged_files", {
    p_ids: expired.map((f) => f.id),
  });
  if (deleteError) return json({ error: "falha_ao_apagar_registros" }, 500);
  return json({ removed: Number(count) });
}
