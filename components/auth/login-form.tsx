"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Field } from "@/components/auth/field";
import { FormMessage } from "@/components/auth/form-message";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/lib/auth/actions";
import { initialActionState } from "@/modules/auth/domain";

export function LoginForm({
  proximo,
  initialMessage,
}: {
  proximo: string;
  initialMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="grid gap-4" aria-busy={pending}>
      <input type="hidden" name="proximo" value={proximo} />
      <FormMessage
        status={state.status === "success" ? "success" : "error"}
        message={initialMessage ?? state.message}
      />

      <Field
        id="login-email"
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        autoFocus
        error={state.fieldErrors?.email}
      />
      <PasswordField
        name="password"
        label="Senha"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />

      <div className="flex justify-end">
        <Link
          href="/recuperar-senha"
          className="text-[13px] font-medium text-brand no-underline hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="orbita-cta mt-1 h-11 w-full bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
