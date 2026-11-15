"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/modules/profile/domain";
import type { FormActionState } from "@/lib/actions/state";

function parse(formData: FormData) {
  return profileSchema.safeParse({
    fullName: formData.get("fullName"),
    timezone: formData.get("timezone"),
  });
}

export async function updateProfileAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const parsed = parse(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      timezone: parsed.data.timezone,
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "Não foi possível salvar o perfil agora. Tente novamente.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Perfil atualizado." };
}

export async function completeOnboardingAction(
  _previous: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await requireUser();
  const parsed = parse(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      timezone: parsed.data.timezone,
      onboarding_done_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message:
        "Não foi possível concluir seu cadastro agora. Tente novamente em instantes.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/?aviso=bem-vindo");
}
