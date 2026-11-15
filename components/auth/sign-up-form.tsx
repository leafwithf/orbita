"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Field } from "@/components/auth/field";
import { FormMessage } from "@/components/auth/form-message";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { signUpAction } from "@/lib/auth/actions";
import { initialActionState } from "@/modules/auth/domain";

export function SignUpForm({ proximo }: { proximo: string }) {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialActionState,
  );

  if (state.status === "success") {
    return (
      <div className="grid gap-4">
        <FormMessage status="success" message={state.message} />
        <p className="text-sm leading-relaxed text-muted">
          Não recebeu? Confira a caixa de spam ou{" "}
          <Link href="/recuperar-senha" className="font-medium">
            solicite um novo link
          </Link>
          .
        </p>
        <Button
          asChild
          variant="outline"
          className="h-11 w-full border-border-strong"
        >
          <Link href="/login">Voltar para entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" aria-busy={pending}>
      <input type="hidden" name="proximo" value={proximo} />
      <FormMessage status="error" message={state.message} />

      <Field
        id="signup-name"
        name="fullName"
        label="Como você quer ser chamado?"
        autoComplete="name"
        placeholder="Seu nome"
        autoFocus
        error={state.fieldErrors?.fullName}
      />
      <Field
        id="signup-email"
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        error={state.fieldErrors?.email}
      />
      <PasswordField
        name="password"
        label="Crie uma senha"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres."
        error={state.fieldErrors?.password}
      />
      <PasswordField
        name="confirmPassword"
        label="Repita a senha"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />

      <p className="text-xs leading-relaxed text-faint">
        Ao criar a conta, você concorda com os{" "}
        <a href="/termos" className="font-medium">
          termos de uso
        </a>{" "}
        e a{" "}
        <a href="/privacidade" className="font-medium">
          política de privacidade
        </a>
        . Nada é publicado sem a sua autorização.
      </p>

      <Button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 w-full bg-brand text-[15px] font-semibold text-white hover:bg-brand-hover"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Criando conta…
          </>
        ) : (
          "Criar minha conta"
        )}
      </Button>
    </form>
  );
}
