"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/lib/actions/state";

const focusSchema = z.object({
  workspaceId: z.uuid(),
  kind: z.enum(["project", "course"]),
  targetId: z.uuid(),
});

const FOCUS_ERRORS: Record<string, string> = {
  forbidden: "Você não tem permissão para mudar o foco deste espaço.",
  invalid_focus_target:
    "Este item não está mais disponível. Atualize a página e tente de novo.",
  workspace_not_found: "O espaço não foi encontrado.",
  not_authenticated: "Sua sessão expirou. Entre novamente.",
};

export async function setPrimaryFocusAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  const parsed = focusSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    kind: formData.get("kind"),
    targetId: formData.get("targetId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Não foi possível identificar o item." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_primary_focus", {
    p_workspace: parsed.data.workspaceId,
    p_kind: parsed.data.kind,
    p_target: parsed.data.targetId,
  });

  if (error) {
    const key = Object.keys(FOCUS_ERRORS).find((candidate) =>
      error.message.includes(candidate),
    );
    return {
      status: "error",
      message:
        (key ? FOCUS_ERRORS[key] : null) ??
        "Não foi possível mudar o foco agora. Tente novamente.",
    };
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message:
      parsed.data.kind === "project"
        ? "Projeto principal atualizado."
        : "Curso principal atualizado.",
  };
}
