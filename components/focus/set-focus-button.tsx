"use client";

import { useActionState, useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setPrimaryFocusAction } from "@/lib/actions/focus";
import { initialFormState, type FormActionState } from "@/lib/actions/state";
import { focusChangePrompt, type FocusKind } from "@/modules/focus/domain";

export function SetFocusButton({
  workspaceId,
  kind,
  targetId,
  targetTitle,
  currentTitle,
}: {
  workspaceId: string;
  kind: FocusKind;
  targetId: string;
  targetTitle: string;
  currentTitle: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous: FormActionState, formData: FormData) => {
      const next = await setPrimaryFocusAction(previous, formData);

      if (next.status === "success") {
        setOpen(false);
        toast.success(next.message ?? "Foco atualizado.");
      } else if (next.status === "error") {
        toast.error(next.message ?? "Não foi possível mudar o foco.");
      }

      return next;
    },
    initialFormState,
  );

  const isChange = Boolean(currentTitle);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={isChange ? "outline" : "default"}
          size="sm"
          className={
            isChange
              ? "border-border-strong"
              : "bg-brand text-white hover:bg-brand-hover"
          }
        >
          {isChange ? (
            <>
              <ArrowRightLeft className="size-3.5" aria-hidden="true" />
              Trocar foco
            </>
          ) : (
            "Definir como principal"
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isChange ? "Trocar o foco principal?" : "Definir foco principal?"}
          </DialogTitle>
          <DialogDescription>
            {focusChangePrompt(kind, currentTitle, targetTitle)}
          </DialogDescription>
        </DialogHeader>

        <ul className="grid gap-1.5 rounded-md border border-border bg-surface-2 px-3.5 py-3 text-[13px] leading-relaxed text-muted">
          <li>Nada é arquivado ou apagado.</li>
          <li>O item anterior continua disponível na lista.</li>
          <li>A troca fica registrada no histórico do espaço.</li>
        </ul>

        {state.status === "error" ? (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {state.message}
          </p>
        ) : null}

        <DialogFooter>
          <form action={formAction} className="flex w-full justify-end gap-2">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="targetId" value={targetId} />
            <DialogClose asChild>
              <Button type="button" variant="outline" className="min-h-10">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={pending}
              className="orbita-cta min-h-10 bg-brand text-white hover:bg-brand-hover"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Salvando…
                </>
              ) : (
                "Confirmar troca"
              )}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
