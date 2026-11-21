"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { FormActionState } from "@/lib/actions/state";
import { getAppContext } from "@/lib/data/context";
import { createClient } from "@/lib/supabase/server";
import { PRIORITIES } from "@/modules/projects/domain";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const { fieldErrors: raw } = z.flattenError(error) as {
    fieldErrors: Record<string, string[] | undefined>;
  };

  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value && value.length > 0),
  ) as Record<string, string[]>;
}

function invalid(error: z.ZodError): FormActionState {
  return {
    status: "error",
    message: "Confira os campos destacados.",
    fieldErrors: fieldErrors(error),
  };
}

function optionalText(max: number, message = `Use até ${max} caracteres.`) {
  return z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length > 0 ? value : null));
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || isCalendarDate(value), "Data inválida.")
  .transform((value) => (value === "" ? null : value));

const optionalHttpUrl = z
  .string()
  .trim()
  .max(500, "Use até 500 caracteres.")
  .refine(
    (value) =>
      value === "" ||
      /^https?:\/\/[^\s]+\.[^\s]+$/i.test(value),
    "Informe um endereço começando com http:// ou https://.",
  )
  .transform((value) => (value === "" ? null : value));

const projectSchema = z.object({
  emoji: z.string().trim().min(1).max(32),
  title: z
    .string()
    .trim()
    .min(1, "Dê um nome ao projeto.")
    .max(160, "Use até 160 caracteres."),
  objective: optionalText(500),
  nextStep: optionalText(300),
  dueDate: optionalDate,
  priority: z.enum(PRIORITIES, { error: "Escolha uma prioridade." }),
  makeFocus: z.boolean(),
});

const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Escreva o que precisa ser feito.")
    .max(200, "Use até 200 caracteres."),
  description: optionalText(4_000),
  projectId: z.union([z.literal(""), z.uuid("Projeto inválido.")]),
  dueDate: optionalDate,
  priority: z.enum(PRIORITIES, { error: "Escolha uma prioridade." }),
  assignee: z.enum(["me", "none"]),
});

const ideaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Escreva a ideia em uma frase.")
    .max(160, "Use até 160 caracteres."),
  body: optionalText(8_000),
});

const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Dê um nome ao curso.")
    .max(160, "Use até 160 caracteres."),
  platform: optionalText(120),
  url: optionalHttpUrl,
  objective: optionalText(500),
  nextLesson: optionalText(200),
  dueDate: optionalDate,
  makeFocus: z.boolean(),
});

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function actionContext() {
  const context = await getAppContext();
  return context.workspace ? context : null;
}

const NO_WORKSPACE: FormActionState = {
  status: "error",
  message:
    "Seu espaço de trabalho ainda não está disponível. Rode as migrações do Supabase e recarregue a página.",
};

export async function createProjectAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await actionContext();
  if (!context?.workspace) return NO_WORKSPACE;

  const parsed = projectSchema.safeParse({
    emoji: read(formData, "emoji") || "🚀",
    title: read(formData, "title"),
    objective: read(formData, "objective"),
    nextStep: read(formData, "nextStep"),
    dueDate: read(formData, "dueDate"),
    priority: read(formData, "priority"),
    makeFocus: formData.get("makeFocus") === "on",
  });

  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: context.workspace.id,
      title: parsed.data.title,
      emoji: parsed.data.emoji,
      objective: parsed.data.objective,
      next_step: parsed.data.nextStep,
      due_date: parsed.data.dueDate,
      priority: parsed.data.priority,
      created_by: context.user.id,
      owner_id: context.user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return {
      status: "error",
      message:
        "Não foi possível criar o projeto agora. Verifique sua permissão no espaço e tente de novo.",
    };
  }

  let focusFailed = false;
  if (parsed.data.makeFocus) {
    const { error: focusError } = await supabase.rpc("set_primary_focus", {
      p_workspace: context.workspace.id,
      p_kind: "project",
      p_target: data.id,
    });
    focusFailed = Boolean(focusError);
  }

  revalidatePath("/", "layout");
  redirect(`/projetos/${data.id}${focusFailed ? "?aviso=foco" : ""}`);
}

export async function createTaskAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await actionContext();
  if (!context?.workspace) return NO_WORKSPACE;

  const parsed = taskSchema.safeParse({
    title: read(formData, "title"),
    description: read(formData, "description"),
    projectId: read(formData, "projectId"),
    dueDate: read(formData, "dueDate"),
    priority: read(formData, "priority"),
    assignee: read(formData, "assignee") || "me",
  });

  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  let projectId: string | null = null;

  if (parsed.data.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.projectId)
      .eq("workspace_id", context.workspace.id)
      .is("deleted_at", null)
      .maybeSingle<{ id: string }>();

    if (!project) {
      return {
        status: "error",
        message: "O projeto escolhido não está disponível.",
        fieldErrors: { projectId: ["Escolha outro projeto."] },
      };
    }

    projectId = project.id;
  }

  const { error } = await supabase.from("tasks").insert({
    workspace_id: context.workspace.id,
    project_id: projectId,
    title: parsed.data.title,
    description: parsed.data.description,
    due_date: parsed.data.dueDate,
    priority: parsed.data.priority,
    assignee_id: parsed.data.assignee === "me" ? context.user.id : null,
    created_by: context.user.id,
  });

  if (error) {
    return {
      status: "error",
      message:
        "Não foi possível criar a tarefa agora. Verifique sua permissão no espaço e tente de novo.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/tarefas?vista=abertas");
}

export async function createIdeaAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await actionContext();
  if (!context?.workspace) return NO_WORKSPACE;

  const parsed = ideaSchema.safeParse({
    title: read(formData, "title"),
    body: read(formData, "body"),
  });

  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("ideas").insert({
    workspace_id: context.workspace.id,
    title: parsed.data.title,
    body: parsed.data.body,
    created_by: context.user.id,
  });

  if (error) {
    return {
      status: "error",
      message:
        "Não foi possível salvar a ideia agora. Verifique sua permissão no espaço e tente de novo.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/backlog");
}

export async function createCourseAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const context = await actionContext();
  if (!context?.workspace) return NO_WORKSPACE;

  const parsed = courseSchema.safeParse({
    title: read(formData, "title"),
    platform: read(formData, "platform"),
    url: read(formData, "url"),
    objective: read(formData, "objective"),
    nextLesson: read(formData, "nextLesson"),
    dueDate: read(formData, "dueDate"),
    makeFocus: formData.get("makeFocus") === "on",
  });

  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      workspace_id: context.workspace.id,
      title: parsed.data.title,
      platform: parsed.data.platform,
      url: parsed.data.url,
      objective: parsed.data.objective,
      next_lesson: parsed.data.nextLesson,
      due_date: parsed.data.dueDate,
      created_by: context.user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return {
      status: "error",
      message:
        "Não foi possível criar o curso agora. Verifique sua permissão no espaço e tente de novo.",
    };
  }

  if (parsed.data.makeFocus) {
    await supabase.rpc("set_primary_focus", {
      p_workspace: context.workspace.id,
      p_kind: "course",
      p_target: data.id,
    });
  }

  revalidatePath("/", "layout");
  redirect("/cursos");
}
