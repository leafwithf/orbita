"use server";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const PALETTES = ["amber", "orange", "blue", "green", "purple", "red"] as const;
export type PalettePreference = (typeof PALETTES)[number];

export async function updatePaletteAction(value: string) {
  if (!PALETTES.includes(value as PalettePreference)) {
    return { success: false as const };
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: user.id, palette: value },
      { onConflict: "user_id" },
    );

  return { success: !error };
}
