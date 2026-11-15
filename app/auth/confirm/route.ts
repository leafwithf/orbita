import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * Email confirmation / recovery link handler for the token_hash flow.
 * Configure the Supabase email templates to point here:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const next = safeNextPath(searchParams.get("next"));

  if (!getSupabaseConfig() || !tokenHash) {
    return NextResponse.redirect(
      new URL("/login?erro=link-invalido", origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?erro=link-expirado", origin),
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
