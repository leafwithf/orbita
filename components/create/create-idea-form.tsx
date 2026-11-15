"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { TextAreaField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { createIdeaAction } from "@/lib/actions/create";
import { initialFormState } from "@/lib/actions/state";

export function CreateIdeaForm() {
  const [state, formAction, pending] = useActionState(
    createIdeaAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage
        status={state.status === "error" ? "error" : "success"}
        message={state.message}
      />

      <TextField
        id="idea-title"
        name="title"
        label="Qual é a ideia?"
        placeholder="Ex.: um curso curto sobre cerâmica para iniciantes"
        required
        autoFocus
        maxLength={160}
        error={state.fieldErrors?.title?.[0]}
        hint="Uma frase já basta. Você pode detalhar depois."
      />

      <TextAreaField
        id="idea-body"
        name="body"
        label="Nota rápida"
        placeholder="Por que isso importa? Para quem? O que falta saber?"
        maxLength={8000}
        error={state.fieldErrors?.body?.[0]}
      />

      <p className="flex items-start gap-2 rounded-md border border-brand/20 bg-brand-soft px-3 py-2.5 text-[12px] leading-relaxed text-[var(--brand-700)]">
        <Lightbulb className="mt-0.5 size-4 flex-none" aria-hidden="true" />
        Ideias ficam no backlog e não competem com o foco principal. Nada é
        apagado por ficar parado.
      </p>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <SubmitButton pending={pending} pendingLabel="Salvando…">
          Salvar ideia
        </SubmitButton>
        <Link
          href="/backlog"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] font-semibold text-muted no-underline hover:bg-surface-2 hover:text-ink hover:no-underline"
        >
          Cancelar
        </Link>
        <span className="text-[11.5px] text-faint">
          Você volta para o backlog.
        </span>
      </div>
    </form>
  );
}
