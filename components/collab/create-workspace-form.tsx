"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/auth/form-message";
import { TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { createWorkspaceAction } from "@/lib/actions/collab";
import { initialFormState } from "@/lib/actions/state";

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspaceAction, initialFormState);

  return (
    <form action={formAction} className="grid gap-3">
      {state.status === "error" ? <FormMessage status="error" message={state.message} /> : null}
      <TextField
        id="ws-name"
        name="name"
        label="Nome do espaço"
        required
        maxLength={80}
        placeholder="Ex.: Equipe de design"
        error={state.fieldErrors?.name?.[0]}
      />
      <fieldset className="grid gap-1.5">
        <legend className="text-[13px] font-medium">Tipo</legend>
        <label className="flex min-h-11 items-center gap-2 text-[13px]">
          <input type="radio" name="kind" value="team" defaultChecked /> Equipe
        </label>
        <label className="flex min-h-11 items-center gap-2 text-[13px]">
          <input type="radio" name="kind" value="client" /> Cliente
        </label>
      </fieldset>
      <div>
        <SubmitButton pending={pending} pendingLabel="Criando…">
          Criar espaço
        </SubmitButton>
      </div>
    </form>
  );
}
