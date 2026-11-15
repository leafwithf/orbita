"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Minus } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { PriorityField } from "@/components/forms/priority-field";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { createTaskAction } from "@/lib/actions/create";
import { initialFormState } from "@/lib/actions/state";
import { addDaysIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function CreateTaskForm({
  today,
  projects,
  defaultProjectId,
}: {
  today: string;
  projects: { id: string; title: string }[];
  defaultProjectId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createTaskAction,
    initialFormState,
  );
  const [dueDate, setDueDate] = useState("");

  const quickDates = [
    { label: "Hoje", value: today, icon: Clock3 },
    { label: "Amanhã", value: addDaysIso(today, 1), icon: CalendarDays },
    { label: "Sem prazo", value: "", icon: Minus },
  ];

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage
        status={state.status === "error" ? "error" : "success"}
        message={state.message}
      />

      <TextField
        id="task-title"
        name="title"
        label="O que precisa ser feito?"
        placeholder="Ex.: revisar o texto da página inicial"
        required
        autoFocus
        maxLength={200}
        error={state.fieldErrors?.title?.[0]}
        hint="Comece com um verbo: revisar, ligar, publicar, comprar."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          id="task-project"
          name="projectId"
          label="Projeto"
          defaultValue={defaultProjectId ?? ""}
          error={state.fieldErrors?.projectId?.[0]}
        >
          <option value="">Sem projeto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="task-assignee"
          name="assignee"
          label="Responsável"
          defaultValue="me"
        >
          <option value="me">Eu mesmo</option>
          <option value="none">Sem responsável</option>
        </SelectField>
      </div>

      <fieldset>
        <legend className="text-[13px] font-medium text-ink">Prazo</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {quickDates.map((option) => {
            const Icon = option.icon;
            const active = dueDate === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setDueDate(option.value)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active
                    ? "border-brand bg-brand-soft text-[var(--brand-700)]"
                    : "border-border-strong bg-surface text-ink hover:bg-surface-2",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 max-w-xs">
          <TextField
            id="task-due-date"
            name="dueDate"
            label="Data escolhida"
            type="date"
            required={false}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            hint="Tarefas sem prazo ficam em “Sem prazo” e não somem."
          />
        </div>
      </fieldset>

      <PriorityField error={state.fieldErrors?.priority?.[0]} />

      <details className="rounded-md border border-border bg-surface-2 px-3.5 py-3">
        <summary className="cursor-pointer text-[13px] font-semibold text-brand">
          Mais detalhes (opcional)
        </summary>
        <div className="mt-3">
          <TextAreaField
            id="task-description"
            name="description"
            label="Descrição"
            placeholder="Contexto, links, critério de conclusão…"
            maxLength={4000}
            error={state.fieldErrors?.description?.[0]}
          />
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <SubmitButton pending={pending} pendingLabel="Criando…">
          Criar tarefa
        </SubmitButton>
        <Link
          href="/tarefas"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] font-semibold text-muted no-underline hover:bg-surface-2 hover:text-ink hover:no-underline"
        >
          Cancelar
        </Link>
        <span className="text-[11.5px] text-faint">
          Você volta para a lista de tarefas.
        </span>
      </div>
    </form>
  );
}
