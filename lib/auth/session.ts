import { cache } from "react";
import { redirect } from "next/navigation";

import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  timezone: string;
  locale: string;
  onboarding_done_at: string | null;
};

/**
 * Resolves the authenticated user for this request. Returns null in setup mode
 * (no Supabase env) and on invalid sessions.
 */
export const getCurrentUser = cache(async () => {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
});

export async function requireUser(proximo = "/") {
  const user = await getCurrentUser();

  if (!user) {
    const query =
      proximo && proximo !== "/"
        ? `?proximo=${encodeURIComponent(proximo)}`
        : "";
    redirect(`/login${query}`);
  }

  return user;
}

export const getProfile = cache(async (userId: string) => {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, timezone, locale, onboarding_done_at")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) {
    return null;
  }

  return data;
});

export function displayName(profile: Profile | null, fallback = "Você") {
  const name = profile?.full_name?.trim();
  return name ? name : fallback;
}

export function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
