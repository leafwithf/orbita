"use client";

import { useActionState, useMemo } from "react";
import Link from "next/link";
import { useState } from "react";
import { Crosshair } from "lucide-react";

import {
  CheckboxField,
  TextField,
} from "@/components/forms/field";
import { FormMessage } from "@/components/auth/form-message";
import { PriorityField } from "@/components/forms/priority-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { createProjectAction } from "@/lib/actions/create";
import { initialFormState } from "@/lib/actions/state";
import { PROJECT_EMOJIS } from "@/components/projects/project-emoji-editor";

export function CreateProjectForm({
  currentFocusTitle,
}: {
  currentFocusTitle: string | null;
}) {
  const [emoji, setEmoji] = useState<string>("🚀");
  const [emojiQuery, setEmojiQuery] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const visibleEmojis = useMemo(
    () => [...new Set(PROJECT_EMOJIS)].filter((item) => item.includes(emojiQuery.trim())),
    [emojiQuery],
  );
  const customEmoji = emojiQuery.trim();
  const canUseCustomEmoji = customEmoji.length > 0 && customEmoji.length <= 8 && /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u.test(customEmoji);
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage
        status={state.status === "error" ? "error" : "success"}
        message={state.message}
      />

      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-ink">Identidade do projeto</span>
        <input type="hidden" name="emoji" value={emoji} />
        <div className="flex flex-wrap items-center gap-2">
          {["🚀", "💡", "🎯"].map((item) => (
            <button key={item} type="button" onClick={() => setEmoji(item)} aria-pressed={emoji === item} className={`grid size-11 place-items-center rounded-xl border text-2xl ${emoji === item ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-border bg-surface hover:bg-surface-2"}`}>
              {item}
            </button>
          ))}
          <button type="button" onClick={() => setLibraryOpen((open) => !open)} aria-expanded={libraryOpen} aria-label="Abrir biblioteca de emojis" className="grid size-11 place-items-center rounded-xl border border-border bg-surface text-xl">…</button>
        </div>
        {libraryOpen ? (
          <div className="grid gap-2 rounded-xl border border-border bg-surface p-3">
            <input value={emojiQuery} onChange={(event) => setEmojiQuery(event.target.value)} placeholder="Buscar ou colar um emoji" aria-label="Buscar emoji" className="h-10 w-full rounded-md border border-input bg-surface-2 px-3 text-sm outline-none focus-visible:border-brand" />
            <div className="grid max-h-48 grid-cols-8 gap-1.5 overflow-y-auto sm:grid-cols-10" role="group" aria-label="Biblioteca de emojis">
              {visibleEmojis.map((item) => (
                <button key={item} type="button" onClick={() => { setEmoji(item); setLibraryOpen(false); }} aria-pressed={emoji === item} className={`grid size-9 place-items-center rounded-lg border text-xl ${emoji === item ? "border-brand bg-brand-soft" : "border-transparent hover:bg-surface-2"}`}>{item}</button>
              ))}
            </div>
            {canUseCustomEmoji ? <button type="button" onClick={() => { setEmoji(customEmoji); setLibraryOpen(false); }} className="min-h-9 justify-self-start rounded-md border border-border px-3 text-xs font-semibold text-brand">Usar {customEmoji}</button> : null}
          </div>
        ) : null}
        <p className="text-[11.5px] leading-relaxed text-faint">Você também poderá enviar uma imagem depois de criar o projeto.</p>
      </div>

      <TextField
        id="project-title"
        name="title"
        label="Nome do projeto"
        placeholder="Ex.: loja de cerâmica"
        required
        autoFocus
        maxLength={160}
        error={state.fieldErrors?.title?.[0]}
        hint="Um nome curto que você reconheça daqui a três meses."
      />

      <TextField
        id="project-objective"
        name="objective"
        label="Qual é o objetivo?"
        placeholder="Ex.: vender as primeiras 30 peças online"
        required={false}
        maxLength={500}
        error={state.fieldErrors?.objective?.[0]}
        hint="Uma frase basta. Ajuda a decidir o que fica de fora."
      />

      <TextField
        id="project-next-step"
        name="nextStep"
        label="Próximo passo"
        placeholder="Ex.: fotografar as cinco peças principais"
        required={false}
        maxLength={300}
        error={state.fieldErrors?.nextStep?.[0]}
        hint="O que fazer em seguida, em uma frase acionável."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="project-due-date"
          name="dueDate"
          label="Prazo"
          type="date"
          required={false}
          error={state.fieldErrors?.dueDate?.[0]}
          hint="Opcional. Você pode trabalhar sem data."
        />
        <PriorityField
          error={state.fieldErrors?.priority?.[0]}
          hint="A prioridade ajuda a ordenar a fila, não cria urgência sozinha."
        />
      </div>

      <CheckboxField
        id="project-make-focus"
        name="makeFocus"
        label="Definir como projeto principal"
        description={
          currentFocusTitle
            ? `Você já tem “${currentFocusTitle}” como foco. Ao marcar, ele volta para a lista com todas as tarefas e notas. Nada é apagado.`
            : "O foco aparece na visão geral e no seu dia. Você pode trocar quando quiser."
        }
      />

      <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-faint">
        <Crosshair className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
        Você pode completar descrição, riscos e arquivos depois, dentro do
        projeto.
      </p>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <SubmitButton pending={pending} pendingLabel="Criando…">
          Criar projeto
        </SubmitButton>
        <Link
          href="/projetos"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] font-semibold text-muted no-underline hover:bg-surface-2 hover:text-ink hover:no-underline"
        >
          Cancelar
        </Link>
        <span className="text-[11.5px] text-faint">
          Você vai direto para o projeto criado.
        </span>
      </div>
    </form>
  );
}
