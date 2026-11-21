"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { FormActionState } from "@/lib/actions/state";
import { requireUser } from "@/lib/auth/session";
import { WORKSPACE_COOKIE, listMyWorkspaces } from "@/lib/data/workspaces";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  collabErrorMessage,
  grantableRoles,
  isKnownCollabError,
  isValidInviteToken,
  normalizeComment,
} from "@/modules/collab/domain";
import { generateInviteToken, hashInviteToken } from "@/modules/collab/token";
import { WORKSPACE_ROLES } from "@/modules/workspaces/domain";

const refresh = () => revalidatePath("/", "layout");
const fail = (message: string): FormActionState => ({ status: "error", message });

/** O banco devolve o código no `message` das nossas exceções; só mostramos os conhecidos. */
function dbFail(error: { message?: string; code?: string }): FormActionState {
  const code = error.message?.trim();
  if (isKnownCollabError(code)) return fail(collabErrorMessage(code));
  if (error.code === "42501") return fail(collabErrorMessage("forbidden"));
  return fail(collabErrorMessage(null));
}

/** Origem pública do site: variável de ambiente, ou o host da própria requisição. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return getSiteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function rememberWorkspace(id: string) {
  (await cookies()).set(WORKSPACE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// --------------------------------------------------------------------------
// Espaços
// --------------------------------------------------------------------------
export async function switchWorkspaceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = z.uuid().safeParse(formData.get("workspaceId"));
  if (!id.success) return;

  // Só troca para um espaço do qual a pessoa é membro ativo.
  const mine = await listMyWorkspaces(user.id);
  if (!mine.some((workspace) => workspace.id === id.data)) return;

  await rememberWorkspace(id.data);
  refresh();
  redirect("/");
}

const workspaceAppearanceSchema = z.object({
  workspaceId: z.uuid(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor válida."),
  coverUrl: z.string().trim().max(2048).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use um endereço HTTPS válido para a imagem."),
});

export async function updateWorkspaceAppearanceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = workspaceAppearanceSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    color: formData.get("color"),
    coverUrl: formData.get("coverUrl") ?? "",
  });
  if (!parsed.success) return;

  // Verificação de aplicação + RLS no banco: somente owner/admin pode alterar.
  const mine = await listMyWorkspaces(user.id);
  const membership = mine.find((item) => item.id === parsed.data.workspaceId);
  if (!membership || !["owner", "admin"].includes(membership.role)) return;

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", parsed.data.workspaceId)
    .maybeSingle();
  if (readError || !current) return;

  const currentSettings =
    current.settings && typeof current.settings === "object" && !Array.isArray(current.settings)
      ? current.settings
      : {};

  const { error } = await supabase
    .from("workspaces")
    .update({
      settings: {
        ...currentSettings,
        brand_color: parsed.data.color.toLowerCase(),
        cover_url: parsed.data.coverUrl || null,
      },
    })
    .eq("id", parsed.data.workspaceId);

  if (error) return;
  refresh();
  revalidatePath("/espacos");
}

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao espaço.").max(80, "Use até 80 caracteres."),
  kind: z.enum(["team", "client"]),
});

export async function createWorkspaceAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind") ?? "team",
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { status: "error", message: "Confira os campos destacados.", fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_workspace", {
    p_name: parsed.data.name,
    p_kind: parsed.data.kind,
  });
  if (error || !data) return error ? dbFail(error) : fail(collabErrorMessage(null));

  await rememberWorkspace(String(data));
  refresh();
  redirect("/espacos");
}

export async function leaveWorkspaceAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("workspaceId"));
  if (!id.success) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_workspace", { p_workspace: id.data });
  if (error) return;

  (await cookies()).delete(WORKSPACE_COOKIE);
  refresh();
  redirect("/");
}

// --------------------------------------------------------------------------
// Convites
// --------------------------------------------------------------------------
const inviteSchema = z.object({
  workspaceId: z.uuid(),
  role: z.enum(WORKSPACE_ROLES).refine((role) => role !== "owner", "Papel inválido."),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((value) => value === "" || z.email().safeParse(value).success, "E-mail inválido.")
    .transform((value) => (value === "" ? null : value.toLowerCase())),
});

export type InviteState = FormActionState & { link?: string };

export async function createInvitationAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  await requireUser();
  const parsed = inviteSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    role: formData.get("role"),
    email: formData.get("email") ?? "",
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { status: "error", message: "Confira os campos destacados.", fieldErrors };
  }

  const supabase = await createClient();
  const { token, hash } = generateInviteToken();
  const { error } = await supabase.rpc("create_invitation", {
    p_workspace: parsed.data.workspaceId,
    p_role: parsed.data.role,
    p_email: parsed.data.email,
    p_token_hash: hash,
  });
  if (error) return dbFail(error);

  revalidatePath("/espacos");
  // O token só existe aqui e na resposta: o banco guarda apenas o hash.
  return {
    status: "success",
    message: "Convite criado. Copie o link agora: ele não será mostrado de novo.",
    link: `${await siteOrigin()}/convite/${token}`,
  };
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("invitationId"));
  if (!id.success) return;

  const supabase = await createClient();
  await supabase.rpc("revoke_invitation", { p_invitation: id.data });
  revalidatePath("/espacos");
}

export async function acceptInvitationAction(formData: FormData): Promise<void> {
  await requireUser();
  const token = String(formData.get("token") ?? "");
  if (!isValidInviteToken(token)) redirect("/convite/invalido");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token_hash: hashInviteToken(token),
  });

  if (error || !data) {
    const code = error?.message?.trim() ?? "invitation_invalid";
    redirect(`/convite/${token}?erro=${encodeURIComponent(isKnownCollabError(code) ? code : "invitation_invalid")}`);
  }

  await rememberWorkspace(String(data));
  refresh();
  redirect("/espacos");
}

// --------------------------------------------------------------------------
// Pessoas e papéis
// --------------------------------------------------------------------------
const memberSchema = z.object({ workspaceId: z.uuid(), userId: z.uuid() });

export async function changeMemberRoleAction(formData: FormData): Promise<void> {
  await requireUser();
  const ids = memberSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    userId: formData.get("userId"),
  });
  const role = z.enum(WORKSPACE_ROLES).safeParse(formData.get("role"));
  if (!ids.success || !role.success || !grantableRoles("owner").includes(role.data)) return;

  const supabase = await createClient();
  await supabase.rpc("change_member_role", {
    p_workspace: ids.data.workspaceId,
    p_user: ids.data.userId,
    p_role: role.data,
  });
  refresh();
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  await requireUser();
  const ids = memberSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    userId: formData.get("userId"),
  });
  if (!ids.success) return;

  const supabase = await createClient();
  await supabase.rpc("remove_member", {
    p_workspace: ids.data.workspaceId,
    p_user: ids.data.userId,
  });
  refresh();
}

// --------------------------------------------------------------------------
// Atribuição de tarefas
// --------------------------------------------------------------------------
export async function assignTaskAction(input: {
  taskId: string;
  assigneeId: string | null;
}): Promise<FormActionState> {
  await requireUser();
  const parsed = z
    .object({ taskId: z.uuid(), assigneeId: z.uuid().nullable() })
    .safeParse(input);
  if (!parsed.success) return fail("Dados inválidos.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ assignee_id: parsed.data.assigneeId })
    .eq("id", parsed.data.taskId);

  if (error) return dbFail(error);
  refresh();
  return { status: "success" };
}

// --------------------------------------------------------------------------
// Comentários
// --------------------------------------------------------------------------
const commentSchema = z.object({
  workspaceId: z.uuid(),
  entityType: z.enum(["project", "task", "course", "idea", "file"]),
  entityId: z.uuid(),
});

export async function addCommentAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const ids = commentSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
  });
  const body = normalizeComment(String(formData.get("body") ?? ""));
  if (!ids.success) return fail("Comentário inválido.");
  if (!body) {
    return {
      status: "error",
      message: "Escreva um comentário de até 5.000 caracteres.",
      fieldErrors: { body: ["Escreva algo antes de enviar."] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    workspace_id: ids.data.workspaceId,
    entity_type: ids.data.entityType,
    entity_id: ids.data.entityId,
    body,
    author_id: user.id,
  });
  if (error) {
    return error.code === "42501" ? fail("Você não tem permissão para comentar aqui.") : dbFail(error);
  }

  refresh();
  return { status: "success", message: "Comentário enviado." };
}

export async function editCommentAction(input: {
  commentId: string;
  body: string;
}): Promise<FormActionState> {
  await requireUser();
  const body = normalizeComment(input.body);
  if (!z.uuid().safeParse(input.commentId).success || !body) return fail("Comentário inválido.");

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", input.commentId)
    .select("id");
  if (error || !data || data.length === 0) return fail("Só o autor pode editar o comentário.");

  refresh();
  return { status: "success" };
}

export async function deleteCommentAction(commentId: string): Promise<FormActionState> {
  await requireUser();
  if (!z.uuid().safeParse(commentId).success) return fail("Comentário inválido.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_comment", { p_comment: commentId });
  if (error) return dbFail(error);

  refresh();
  return { status: "success" };
}

// --------------------------------------------------------------------------
// Notificações
// --------------------------------------------------------------------------
export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("notificationId"));
  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read", { p_ids: id.success ? [id.data] : null });
  refresh();
}
