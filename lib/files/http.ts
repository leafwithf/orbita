import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const BUCKET = "workspace-files";

export function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Rotas POST só aceitam requisições feitas pelo próprio site (defesa contra CSRF). */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

/** Devolve o cliente Supabase da sessão, ou uma resposta 401/403 pronta. */
export async function authorize(request: NextRequest, { mutating }: { mutating: boolean }) {
  if (mutating && !isSameOrigin(request)) {
    return { error: json({ error: "origem_invalida" }, 403) } as const;
  }
  const user = await getCurrentUser();
  if (!user) return { error: json({ error: "nao_autenticado" }, 401) } as const;
  return { user, supabase: await createClient() } as const;
}
