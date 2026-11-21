"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { TextAreaField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/actions/state";
import { updateProjectDetailsAction } from "@/lib/actions/projects";

export function ProjectDetailsEditor({
  project,
  workspaceId,
}: {
  workspaceId: string;
  project: {
    id: string;
    title: string;
    objective: string | null;
    description: string | null;
    nextStep: string | null;
    risks: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateProjectDetailsAction,
    initialFormState,
  );

  return (
    <div className="grid w-full basis-full gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-9 gap-2"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? <X className="size-4" /> : <Pencil className="size-4" />}
        {open ? "Fechar edição" : "Editar projeto"}
      </Button>

      {open ? (
        <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface-2/50 p-4">
          <input type="hidden" name="projectId" value={project.id} />
          <FormMessage
            status={state.status === "error" ? "error" : "success"}
            message={state.message}
          />
          <TextField
            id="project-edit-title"
            name="title"
            label="Nome do projeto"
            defaultValue={project.title}
            required
            maxLength={160}
            error={state.fieldErrors?.title?.[0]}
          />
          <TextAreaField
            id="project-edit-objective"
            workspaceId={workspaceId}
            name="objective"
            label="Objetivo"
            defaultValue={project.objective ?? ""}
            maxLength={500}
            required={false}
            error={state.fieldErrors?.objective?.[0]}
          />
          <TextAreaField
            id="project-edit-description"
            workspaceId={workspaceId}
            name="description"
            label="Descrição"
            defaultValue={project.description ?? ""}
            maxLength={4000}
            required={false}
            error={state.fieldErrors?.description?.[0]}
          />
          <TextAreaField
            id="project-edit-next-step"
            workspaceId={workspaceId}
            name="nextStep"
            label="Próximo passo"
            defaultValue={project.nextStep ?? ""}
            maxLength={300}
            required={false}
            error={state.fieldErrors?.nextStep?.[0]}
          />
          <TextAreaField
            id="project-edit-risks"
            workspaceId={workspaceId}
            name="risks"
            label="Riscos e bloqueios"
            defaultValue={project.risks ?? ""}
            maxLength={2000}
            required={false}
            error={state.fieldErrors?.risks?.[0]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton pending={pending} pendingLabel="Salvando…">
              Salvar alterações
            </SubmitButton>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
