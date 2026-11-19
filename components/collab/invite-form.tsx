"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { createInvitationAction, type InviteState } from "@/lib/actions/collab";
import { INVITE_TTL_DAYS } from "@/modules/collab/domain";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type WorkspaceRole } from "@/modules/workspaces/domain";

const initial: InviteState = { status: "idle" };

export function InviteForm({
  workspaceId,
  roles,
}: {
  workspaceId: string;
  roles: WorkspaceRole[];
}) {
  const [state, formAction, pending] = useActionState(createInvitationAction, initial);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<WorkspaceRole>(roles.includes("editor") ? "editor" : roles[0]);

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false); // o campo continua selecionável para copiar à mão
    }
  }

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="workspaceId" value={workspaceId} />

        <div className="grid gap-1.5">
          <label htmlFor="invite-role" className="text-[13px] font-medium">
            Papel
          </label>
          <select
            id="invite-role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as WorkspaceRole)}
            className="h-11 rounded-md border border-border-strong bg-surface px-3 text-[15px] md:text-sm"
          >
            {roles.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="text-xs leading-relaxed text-faint">{ROLE_DESCRIPTIONS[role]}</p>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="invite-email" className="text-[13px] font-medium">
            E-mail da pessoa <span className="font-normal text-faint">(opcional)</span>
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            maxLength={254}
            placeholder="nome@exemplo.com"
            aria-invalid={state.fieldErrors?.email ? true : undefined}
            aria-describedby="invite-email-hint"
            className="h-11 rounded-md border border-border-strong bg-surface px-3 text-[15px] md:text-sm"
          />
          <p id="invite-email-hint" className="text-xs leading-relaxed text-faint">
            Se informar, só quem entrar com esse e-mail consegue aceitar. Sem e-mail, vale para
            quem tiver o link. Nenhum e-mail é enviado: você compartilha o link.
          </p>
          {state.fieldErrors?.email?.[0] ? (
            <p className="text-xs text-danger">{state.fieldErrors.email[0]}</p>
          ) : null}
        </div>

        {state.status === "error" ? <FormMessage status="error" message={state.message} /> : null}

        <div>
          <SubmitButton pending={pending} pendingLabel="Criando…">
            <Link2 className="size-4" aria-hidden="true" />
            Criar link de convite
          </SubmitButton>
        </div>
      </form>

      {state.status === "success" && state.link ? (
        <div role="status" className="grid gap-2 rounded-md border border-success/30 bg-success-soft p-3">
          <p className="text-[13px] font-medium">{state.message}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={state.link}
              aria-label="Link do convite"
              onFocus={(event) => event.currentTarget.select()}
              className="h-11 min-w-0 flex-1 rounded-md border border-border-strong bg-surface px-3 text-[13px]"
            />
            <button
              type="button"
              onClick={() => copy(state.link as string)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2"
            >
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-[11.5px] text-muted">
            Vale por {INVITE_TTL_DAYS} dias e só pode ser usado uma vez. Você pode cancelá-lo na lista abaixo.
          </p>
        </div>
      ) : null}
    </div>
  );
}
