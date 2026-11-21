import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PalettePreference } from "@/lib/actions/preferences";

const DEFAULT_PALETTE: PalettePreference = "amber";
const VALID_PALETTES = new Set<PalettePreference>([
  "amber",
  "orange",
  "blue",
  "green",
  "purple",
  "red",
]);

export async function getUserPalette(userId?: string): Promise<PalettePreference> {
  const user = userId ? { id: userId } : await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("palette")
    .eq("user_id", user.id)
    .maybeSingle();

  const value = data?.palette as PalettePreference | undefined;
  return value && VALID_PALETTES.has(value) ? value : DEFAULT_PALETTE;
}
