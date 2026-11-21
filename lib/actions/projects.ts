"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormActionState } from "@/lib/actions/state";
import { getAppContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";

const emojiSchema = z.object({
  projectId: z.uuid("Projeto inválido."),
  emoji: z.string().trim().min(1, "Escolha um emoji.").max(32, "Emoji inválido."),
});

const projectDetailsSchema = z.object({
  projectId: z.uuid("Projeto inválido."),
  title: z.string().trim().min(1, "Dê um nome ao projeto.").max(160, "Use até 160 caracteres."),
  objective: z.string().trim().max(500, "Use até 500 caracteres."),
  description: z.string().trim().max(4000, "Use até 4.000 caracteres."),
  nextStep: z.string().trim().max(300, "Use até 300 caracteres."),
  risks: z.string().trim().max(2000, "Use até 2.000 caracteres."),
});

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function ownedProject(projectId: string, workspaceId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, owner_id, created_by")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle<{ id: string; owner_id: string | null; created_by: string | null }>();

  if (!data || (data.owner_id ?? data.created_by) !== userId) return null;
  return { supabase, projectId: data.id };
}

export async function updateProjectEmojiAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await getAppContext();
  if (!context.workspace) {
    return { status: "error", message: "Espaço de trabalho indisponível." };
  }

  const parsed = emojiSchema.safeParse({
    projectId: read(formData, "projectId"),
    emoji: read(formData, "emoji"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Escolha um emoji válido." };
  }

  const owned = await ownedProject(parsed.data.projectId, context.workspace.id, context.user.id);
  if (!owned) {
    return { status: "error", message: "Somente o proprietário do projeto pode alterar sua identidade." };
  }

  const { error } = await owned.supabase
    .from("projects")
    .update({ emoji: parsed.data.emoji, cover_url: null })
    .eq("id", owned.projectId)
    .eq("workspace_id", context.workspace.id)
    .is("deleted_at", null);

  if (error) {
    return { status: "error", message: "Não foi possível atualizar o emoji. Verifique sua permissão e tente novamente." };
  }

  revalidatePath("/", "layout");
  revalidatePath(`/projetos/${owned.projectId}`);
  revalidatePath("/projetos");
  return { status: "success", message: "Emoji atualizado." };
}

export async function updateProjectDetailsAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await getAppContext();
  if (!context.workspace) {
    return { status: "error", message: "Espaço de trabalho indisponível." };
  }

  const parsed = projectDetailsSchema.safeParse({
    projectId: read(formData, "projectId"),
    title: read(formData, "title"),
    objective: read(formData, "objective"),
    description: read(formData, "description"),
    nextStep: read(formData, "nextStep"),
    risks: read(formData, "risks"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos e tente novamente.",
      fieldErrors: Object.fromEntries(
        Object.entries(z.flattenError(parsed.error).fieldErrors)
          .filter(([, value]) => value?.length)
          .map(([key, value]) => [key, value ?? []]),
      ),
    };
  }

  const owned = await ownedProject(parsed.data.projectId, context.workspace.id, context.user.id);
  if (!owned) {
    return { status: "error", message: "Somente o proprietário do projeto pode editá-lo." };
  }

  const { error } = await owned.supabase
    .from("projects")
    .update({
      title: parsed.data.title,
      objective: parsed.data.objective || null,
      description: parsed.data.description || null,
      next_step: parsed.data.nextStep || null,
      risks: parsed.data.risks || null,
    })
    .eq("id", owned.projectId)
    .eq("workspace_id", context.workspace.id)
    .is("deleted_at", null);

  if (error) {
    return { status: "error", message: "Não foi possível salvar as alterações. Verifique sua permissão e tente novamente." };
  }

  revalidatePath("/", "layout");
  revalidatePath(`/projetos/${owned.projectId}`);
  revalidatePath("/projetos");
  return { status: "success", message: "Projeto atualizado com sucesso." };
}

export async function uploadProjectIconAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await getAppContext();
  if (!context.workspace) {
    return { status: "error", message: "Espaço de trabalho indisponível." };
  }

  const projectId = read(formData, "projectId");
  const owned = z.uuid().safeParse(projectId);
  if (!owned.success) {
    return { status: "error", message: "Projeto inválido." };
  }

  const file = formData.get("icon");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione uma imagem antes de enviar." };
  }
  const allowedTypes = new Map([
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
  ]);
  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return { status: "error", message: "Use uma imagem PNG, JPG, WEBP ou GIF." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { status: "error", message: "A imagem deve ter no máximo 4 MB." };
  }

  const project = await ownedProject(projectId, context.workspace.id, context.user.id);
  if (!project) {
    return { status: "error", message: "Somente o proprietário do projeto pode alterar sua identidade." };
  }

  const path = `${context.user.id}/${projectId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await project.supabase.storage
    .from("project-icons")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { status: "error", message: "Não foi possível enviar a imagem. Confirme se a configuração de ícones foi aplicada no Supabase." };
  }

  const { data: publicUrl } = project.supabase.storage
    .from("project-icons")
    .getPublicUrl(path);

  const { error: updateError } = await project.supabase
    .from("projects")
    .update({ cover_url: publicUrl.publicUrl })
    .eq("id", projectId)
    .eq("workspace_id", context.workspace.id)
    .is("deleted_at", null);

  if (updateError) {
    await project.supabase.storage.from("project-icons").remove([path]);
    return { status: "error", message: "A imagem foi enviada, mas não foi possível vinculá-la ao projeto." };
  }

  revalidatePath("/", "layout");
  revalidatePath(`/projetos/${projectId}`);
  revalidatePath("/projetos");
  return { status: "success", message: "Imagem do projeto atualizada." };
}
