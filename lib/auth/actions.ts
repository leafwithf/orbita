"use server";

import { redirect } from "next/navigation";

import { getSiteUrl, getSupabaseConfig } from "@/lib/env";
import { authErrorMessage, safeNextPath } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  recoverySchema,
  resetPasswordSchema,
  signUpSchema,
  toFieldErrors,
  type ActionState,
} from "@/modules/auth/domain";

function setupError(): ActionState {
  return {
    status: "error",
    message:
      "A autenticação ainda não foi configurada neste ambiente. Defina as variáveis do Supabase para entrar.",
  };
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!getSupabaseConfig()) return setupError();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: authErrorMessage(error) };
  }

  redirect(safeNextPath(formData.get("proximo")));
}

export async function signUpAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!getSupabaseConfig()) return setupError();

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/bem-vindo`,
    },
  });

  if (error) {
    return { status: "error", message: authErrorMessage(error) };
  }

  if (data.session) {
    redirect("/bem-vindo");
  }

  return {
    status: "success",
    message:
      "Conta criada. Enviamos um link de confirmação para o seu e-mail. Abra o link para entrar.",
  };
}

export async function recoveryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!getSupabaseConfig()) return setupError();

  const parsed = recoverySchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Digite um e-mail válido.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/redefinir-senha`,
    },
  );

  if (error) {
    return { status: "error", message: authErrorMessage(error) };
  }

  return {
    status: "success",
    message:
      "Se existir uma conta com este e-mail, o link de recuperação chegará em instantes. Confira também a caixa de spam.",
  };
}

export async function resetPasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!getSupabaseConfig()) return setupError();

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: authErrorMessage(error) };
  }

  redirect("/?aviso=senha-atualizada");
}

export async function signOutAction() {
  if (!getSupabaseConfig()) redirect("/login");

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
