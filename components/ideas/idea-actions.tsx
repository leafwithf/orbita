"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  convertIdeaAction,
  restoreItemAction,
  setIdeaStateAction,
  trashItemAction,
} from "@/lib/actions/mvp";
import { IDEA_STATE_LABELS, IDEA_STATES } from "@/modules/ideas/domain";
import { cn } from "@/lib/utils";

const button =
  "inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50";

export function IdeaActions({
  ideaId,
  title,
  state,
}: {
  ideaId: string;
  title: string;
  state: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const converted = state === "converted";

  async function convert() {
    setBusy(true);
    const result = await convertIdeaAction(ideaId);
    setBusy(false);
    if (result.status === "error" || !result.projectId) {
      toast.error(result.message ?? "Não foi possível converter a ideia.");
      return;
    }
    toast.success("Ideia convertida em projeto.", { description: title });
    router.push(`/projetos/${result.projectId}`);
  }

  async function changeState(next: string) {
    const result = await setIdeaStateAction(
      ideaId,
      next as (typeof IDEA_STATES)[number],
    );
    if (result.status === "error") toast.error(result.message ?? "Erro.");
    router.refresh();
  }

  async function trash() {
    const result = await trashItemAction("ideas", ideaId);
    if (result.status === "error") {
      toast.error(result.message ?? "Não foi possível excluir.");
      return;
    }
    router.refresh();
    toast("Ideia movida para a lixeira.", {
      description: title,
      duration: 8000,
      action: {
        label: "Desfazer",
        onClick: () => {
          void restoreItemAction("ideas", ideaId).then(() => router.refresh());
        },
      },
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
      {!converted ? (
        <>
          <button type="button" className={cn(button, "border-brand text-brand")} onClick={convert} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
            Converter em projeto
          </button>
          <label className="inline-flex items-center gap-2 text-[12px] text-muted">
            <span>Estado</span>
            <select
              className="min-h-11 rounded-md border border-border-strong bg-surface px-2 text-[12.5px] text-ink"
              value={state}
              onChange={(event) => changeState(event.target.value)}
            >
              {IDEA_STATES.filter((value) => value !== "converted").map((value) => (
                <option key={value} value={value}>
                  {IDEA_STATE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}
      <button
        type="button"
        className={cn(button, "ml-auto")}
        onClick={trash}
        aria-label={`Excluir ideia: ${title}`}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Excluir
      </button>
    </div>
  );
}
