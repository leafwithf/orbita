"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { initialFormState } from "@/lib/actions/state";
import { updateProjectEmojiAction } from "@/lib/actions/projects";

const PROJECT_EMOJIS = [
  "🚀", "💡", "🎯", "💻", "🎨", "📱", "🧠", "📚",
  "🎮", "🏗️", "🌱", "💼", "🛠️", "✨", "❤️", "📊",
] as const;

export function ProjectEmojiEditor({
  projectId,
  currentEmoji,
}: {
  projectId: string;
  currentEmoji: string;
}) {
  const [emoji, setEmoji] = useState(currentEmoji || "🚀");
  const [state, formAction, pending] = useActionState(
    updateProjectEmojiAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="emoji" value={emoji} />
      <FormMessage
        status={state.status === "error" ? "error" : "success"}
        message={state.message}
      />
      <div className="grid grid-cols-8 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Escolha um emoji para o projeto">
        {PROJECT_EMOJIS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setEmoji(item)}
            aria-pressed={emoji === item}
            aria-label={`Usar ${item}`}
            className={`grid size-10 place-items-center rounded-lg border text-xl transition-colors ${emoji === item ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-border bg-surface hover:bg-surface-2"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending} pendingLabel="Salvando…">
          Salvar emoji
        </SubmitButton>
        <span className="text-[11.5px] text-faint">Atual: {emoji}</span>
      </div>
    </form>
  );
}
