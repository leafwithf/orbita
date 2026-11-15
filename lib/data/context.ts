import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { getProfile, requireUser, type Profile } from "@/lib/auth/session";
import {
  getCurrentWorkspace,
  type WorkspaceSummary,
} from "@/lib/data/workspaces";
import { todayInTimeZone } from "@/lib/dates";

export type AppContext = {
  user: User;
  profile: Profile | null;
  workspace: WorkspaceSummary | null;
  today: string;
  timeZone: string;
};

/**
 * Single source of truth for the authenticated area. Cached per request so the
 * layout and the page do not repeat the same three queries.
 */
export const getAppContext = cache(async (): Promise<AppContext> => {
  const user = await requireUser();
  const [profile, workspace] = await Promise.all([
    getProfile(user.id),
    getCurrentWorkspace(user.id),
  ]);
  const timeZone = profile?.timezone || "America/Sao_Paulo";

  return {
    user,
    profile,
    workspace,
    timeZone,
    today: todayInTimeZone(timeZone),
  };
});

export function contextDisplayName(context: AppContext): string {
  const name = context.profile?.full_name?.trim();
  return name || context.user.email?.split("@")[0] || "Você";
}
