"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormActionState } from "@/lib/actions/state";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { IDEA_STATES } from "@/modules/ideas/domain";
import { rebalancePositions } from "@/modules/tasks/kanban";

const STATUSES = ["todo", "in_progress", "done"] as const;
const TRASHABLE = ["projects", "tasks", "ideas", "courses"] as const;

const fail = (message: string): FormActionState => ({ status: "error", message });
const ok: FormActionState = { status: "success" };
const refresh = () => revalidatePath("/", "layout");

export async function moveTaskAction(input: {
  taskId: string;
  status: (typeof STATUSES)[number];
  position: number;
}): Promise<FormActionState> {
  await requireUser();
  const parsed = z
    .object({
      taskId: z.uuid(),
      status: z.enum(STATUSES),
      position: z.number().finite().min(-1e12).max(1e12),
    })
    .safeParse(input);
  if (!parsed.success) return fail("Movimento inválido.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status, position: parsed.data.position })
    .eq("id", parsed.data.taskId);

  if (error) return fail("Não foi possível mover a tarefa. Tente novamente.");
  refresh();
  return ok;
}

/** Renumera uma coluna inteira (usado quando o espaço entre posições acaba). */
export async function reorderColumnAction(input: {
  status: (typeof STATUSES)[number];
  orderedIds: string[];
}): Promise<FormActionState> {
  await requireUser();
  const parsed = z
    .object({
      status: z.enum(STATUSES),
      orderedIds: z.array(z.uuid()).min(1).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return fail("Ordem inválida.");

  const supabase = await createClient();
  const positions = rebalancePositions(parsed.data.orderedIds.length);
  const results = await Promise.all(
    parsed.data.orderedIds.map((id, index) =>
      supabase
        .from("tasks")
        .update({ status: parsed.data.status, position: positions[index] })
        .eq("id", id),
    ),
  );

  if (results.some((result) => result.error)) {
    return fail("Não foi possível reorganizar a coluna.");
  }
  refresh();
  return ok;
}

export async function convertIdeaAction(
  ideaId: string,
): Promise<FormActionState & { projectId?: string }> {
  await requireUser();
  if (!z.uuid().safeParse(ideaId).success) return fail("Ideia inválida.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_idea_to_project", {
    p_idea: ideaId,
  });

  if (error) {
    return fail(
      error.code === "23505"
        ? "Esta ideia já virou projeto."
        : "Não foi possível converter a ideia. Tente novamente.",
    );
  }
  refresh();
  return { status: "success", projectId: String(data) };
}

export async function setIdeaStateAction(
  ideaId: string,
  state: (typeof IDEA_STATES)[number],
): Promise<FormActionState> {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), state: z.enum(IDEA_STATES) })
    .safeParse({ id: ideaId, state });
  // "converted" só é alcançado pela conversão, que cria o projeto.
  if (!parsed.success || parsed.data.state === "converted") {
    return fail("Estado inválido.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .update({ state: parsed.data.state })
    .eq("id", parsed.data.id);

  if (error) return fail("Não foi possível atualizar a ideia.");
  refresh();
  return ok;
}

const trashSchema = z.object({
  kind: z.enum(TRASHABLE),
  id: z.uuid(),
});

async function setDeleted(
  kind: string,
  id: string,
  deleted: boolean,
): Promise<FormActionState> {
  await requireUser();
  const parsed = trashSchema.safeParse({ kind, id });
  if (!parsed.success) return fail("Item inválido.");

  const supabase = await createClient();
  const { error } = await supabase
    .from(parsed.data.kind)
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq("id", parsed.data.id);

  if (error) {
    return fail(
      deleted
        ? "Não foi possível mover para a lixeira."
        : "Não foi possível restaurar o item.",
    );
  }
  refresh();
  return ok;
}

export async function trashItemAction(kind: string, id: string) {
  return setDeleted(kind, id, true);
}

export async function restoreItemAction(kind: string, id: string) {
  return setDeleted(kind, id, false);
}

/** Versão para <form action>, usada na página da lixeira (funciona sem JavaScript). */
export async function restoreItemFormAction(formData: FormData): Promise<void> {
  const kind = formData.get("kind");
  const id = formData.get("id");
  await setDeleted(String(kind ?? ""), String(id ?? ""), false);
}
