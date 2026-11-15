"use client";

import { useActionState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import {
  CheckboxField,
  TextField,
} from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { createCourseAction } from "@/lib/actions/create";
import { initialFormState } from "@/lib/actions/state";

export function CreateCourseForm({
  currentFocusTitle,
}: {
  currentFocusTitle: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    createCourseAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage
        status={state.status === "error" ? "error" : "success"}
        message={state.message}
      />

      <TextField
        id="course-title"
        name="title"
        label="Nome do curso"
        placeholder="Ex.: fundamentos de cerâmica"
        required
        autoFocus
        maxLength={160}
        error={state.fieldErrors?.title?.[0]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="course-platform"
          name="platform"
          label="Plataforma"
          placeholder="Ex.: Coursera, YouTube, livro"
          required={false}
          maxLength={120}
          error={state.fieldErrors?.platform?.[0]}
        />
        <TextField
          id="course-url"
          name="url"
          label="Link do curso"
          type="url"
          placeholder="https://…"
          required={false}
          maxLength={500}
          error={state.fieldErrors?.url?.[0]}
          hint="Abre em nova aba a partir da lista de cursos."
        />
      </div>

      <TextField
        id="course-objective"
        name="objective"
        label="Por que você quer estudar isso?"
        placeholder="Ex.: conseguir produzir e vender minhas próprias peças"
        required={false}
        maxLength={500}
        error={state.fieldErrors?.objective?.[0]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="course-next-lesson"
          name="nextLesson"
          label="Próxima aula ou módulo"
          placeholder="Ex.: módulo 2 — modelagem manual"
          required={false}
          maxLength={200}
          error={state.fieldErrors?.nextLesson?.[0]}
          hint="Aparece na visão geral para você retomar sem procurar."
        />
        <TextField
          id="course-due-date"
          name="dueDate"
          label="Prazo"
          type="date"
          required={false}
          error={state.fieldErrors?.dueDate?.[0]}
          hint="Opcional. Estudar também pode não ter data."
        />
      </div>

      <CheckboxField
        id="course-make-focus"
        name="makeFocus"
        label="Definir como curso principal"
        description={
          currentFocusTitle
            ? `Você já tem “${currentFocusTitle}” como foco. Ao marcar, ele continua disponível na fila de estudos. Nada é apagado.`
            : "O curso principal aparece na visão geral. Os outros ficam na fila, sem cobrança."
        }
      />

      <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-faint">
        <BookOpen className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
        Você pode adicionar módulos e atualizar o progresso depois.
      </p>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <SubmitButton pending={pending} pendingLabel="Criando…">
          Criar curso
        </SubmitButton>
        <Link
          href="/cursos"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] font-semibold text-muted no-underline hover:bg-surface-2 hover:text-ink hover:no-underline"
        >
          Cancelar
        </Link>
        <span className="text-[11.5px] text-faint">
          Você volta para a lista de cursos.
        </span>
      </div>
    </form>
  );
}
