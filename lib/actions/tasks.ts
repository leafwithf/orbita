"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/lib/actions/state";

export async function setTaskDoneAction(
  taskId: string,
  done: boolean,
): Promise<FormActionState> {
  await requireUser();

  if (!z.uuid().safeParse(taskId).success) {
    return { status: "error", message: "Tarefa inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) {
    return {
      status: "error",
      message: "Não foi possível atualizar a tarefa. Tente novamente.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
