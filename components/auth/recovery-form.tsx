"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Field } from "@/components/auth/field";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { recoveryAction } from "@/lib/auth/actions";
import { initialActionState } from "@/modules/auth/domain";

export function RecoveryForm() {
  const [state, formAction, pending] = useActionState(
    recoveryAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="grid gap-4" aria-busy={pending}>
      <FormMessage
        status={state.status === "success" ? "success" : "error"}
        message={state.message}
      />
      <Field
        id="recovery-email"
        name="email"
        label="E-mail da conta"
        type="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        autoFocus
        error={state.fieldErrors?.email}
      />
      <Button
        type="submit"
        disabled={pending}
        className="orbita-cta mt-1 h-11 w-full bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          "Enviar link de recuperação"
        )}
      </Button>
    </form>
  );
}
