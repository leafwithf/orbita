"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormActionState } from "@/lib/actions/state";
import { getAppContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";

const emojiSchema = z.object({
  projectId: z.uuid("Projeto inválido."),
  emoji: z.string().trim().min(1, "Escolha um emoji.").max(8, "Emoji inválido."),
});

export async function updateProjectEmojiAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await getAppContext();
  if (!context.workspace) {
    return { status: "error", message: "Espaço de trabalho indisponível." };
  }

  const parsed = emojiSchema.safeParse({
    projectId: formData.get("projectId"),
    emoji: formData.get("emoji"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Escolha um emoji válido.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ emoji: parsed.data.emoji })
    .eq("id", parsed.data.projectId)
    .eq("workspace_id", context.workspace.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return {
      status: "error",
      message: "Não foi possível atualizar o emoji. Verifique sua permissão e tente novamente.",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath(`/projetos/${data.id}`);
  revalidatePath("/projetos");
  return { status: "success", message: "Emoji atualizado." };
}
