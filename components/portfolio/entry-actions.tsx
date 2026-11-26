"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { LinkBox } from "@/components/portfolio/link-box";
import {
  revokePortfolioAction,
  rotatePortfolioTokenAction,
  type PortfolioLinkState,
} from "@/lib/actions/portfolio";

const initial: PortfolioLinkState = { status: "idle" };

export function EntryActions({ entryId }: { entryId: string }) {
  const [state, rotate, pending] = useActionState(rotatePortfolioTokenAction, initial);

  return (
    <div className="mt-2 grid gap-2">
      <div className="flex flex-wrap gap-2">
        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2">
            <KeyRound className="size-4" aria-hidden="true" />
            Trocar token
          </summary>
          <form action={rotate} className="mt-2 grid gap-2 rounded-md border border-border p-3">
            <input type="hidden" name="entryId" value={entryId} />
            <p className="text-[12.5px] leading-relaxed text-muted">
              O link atual para de funcionar na hora e um novo é gerado.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="orbita-cta min-h-11 rounded-md bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {pending ? "Trocando…" : "Confirmar troca"}
            </button>
          </form>
        </details>

        <details>
          <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-danger/40 bg-surface px-3 text-[12.5px] font-semibold text-danger hover:bg-surface-2">
            Revogar link
          </summary>
          <form action={revokePortfolioAction} className="mt-2 grid gap-2 rounded-md border border-danger/30 p-3">
            <input type="hidden" name="entryId" value={entryId} />
            <p className="text-[12.5px] leading-relaxed text-muted">
              O link deixa de abrir imediatamente. O projeto não é apagado.
            </p>
            <button
              type="submit"
              className="min-h-11 rounded-md bg-danger px-3 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Confirmar revogação
            </button>
          </form>
        </details>
      </div>

      {state.status === "error" ? <FormMessage status="error" message={state.message} /> : null}
      {state.status === "success" && state.link ? (
        <LinkBox link={state.link} message={state.message} />
      ) : null}
    </div>
  );
}
