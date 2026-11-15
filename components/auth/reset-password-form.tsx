"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/lib/auth/actions";
import { initialActionState } from "@/modules/auth/domain";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="grid gap-4" aria-busy={pending}>
      <FormMessage status="error" message={state.message} />
      <PasswordField
        name="password"
        label="Nova senha"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres."
        error={state.fieldErrors?.password}
      />
      <PasswordField
        name="confirmPassword"
        label="Repita a nova senha"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />
      <Button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 w-full bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Salvando…
          </>
        ) : (
          "Salvar nova senha"
        )}
      </Button>
    </form>
  );
}
