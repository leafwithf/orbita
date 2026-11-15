import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE callback for password recovery (and future OAuth providers).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const errorDescription = searchParams.get("error_description");

  if (errorDescription || !getSupabaseConfig() || !code) {
    return NextResponse.redirect(
      new URL("/login?erro=link-invalido", origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?erro=link-expirado", origin),
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
