"use client";

import { useActionState, useEffect } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { FormMessage } from "@/components/auth/form-message";
import {
  SelectField,
  TextField,
} from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/lib/actions/profile";
import { initialFormState } from "@/lib/actions/state";
import { signOutAction } from "@/lib/auth/actions";
import { getInitials } from "@/lib/names";
import {
  TIMEZONES,
  TIMEZONE_LABELS,
  isProfileTimezone,
} from "@/modules/profile/domain";

export function ProfileForm({
  fullName,
  timezone,
  email,
}: {
  fullName: string;
  timezone: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Perfil atualizado.");
    }
  }, [state]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,1fr)]">
      <form action={formAction} className="grid gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 flex-none place-items-center rounded-full bg-brand-soft text-[17px] font-semibold text-[var(--brand-700)]"
          >
            {getInitials(fullName || email, "?")}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">Sua foto</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
              O envio de foto entra junto com o armazenamento de arquivos. Por
              enquanto, usamos suas iniciais.
            </p>
          </div>
        </div>

        <FormMessage status={state.status === "error" ? "error" : "success"} message={state.message} />

        <TextField
          id="fullName"
          name="fullName"
          label="Como você quer ser chamado"
          defaultValue={fullName}
          autoComplete="name"
          maxLength={120}
          required
          error={state.fieldErrors?.fullName?.[0]}
          hint="Aparece no seu perfil e nas tarefas atribuídas a você."
        />

        <div className="grid gap-1.5">
          <label
            htmlFor="email"
            className="text-[13px] font-medium text-ink"
          >
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            readOnly
            className="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-[15px] text-muted md:text-sm"
          />
          <p className="text-xs leading-relaxed text-faint">
            Para trocar o e-mail, é preciso confirmar a identidade em dois
            passos. Esse fluxo chega antes do lançamento.
          </p>
        </div>

        <SelectField
          id="timezone"
          name="timezone"
          label="Fuso horário"
          defaultValue={
            isProfileTimezone(timezone) ? timezone : "America/Sao_Paulo"
          }
          required
          error={state.fieldErrors?.timezone?.[0]}
          hint="Prazos são datas de calendário: não mudam de dia conforme o fuso."
        >
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {TIMEZONE_LABELS[zone]}
            </option>
          ))}
        </SelectField>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <SubmitButton pending={pending} pendingLabel="Salvando…">
            Salvar alterações
          </SubmitButton>
          <span className="text-[11.5px] text-faint">
            Nada é enviado sem você confirmar.
          </span>
        </div>
      </form>

      <aside className="grid content-start gap-3">
        <div className="rounded-md border border-border bg-surface-2 px-3.5 py-3">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold">
            <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
            Segurança
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Sua sessão é protegida por cookies httpOnly e renovada a cada
            requisição. Nenhuma chave secreta chega ao navegador.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-3 min-h-10 border-border-strong bg-surface"
          >
            <a href="/recuperar-senha">
              <KeyRound className="size-4" aria-hidden="true" />
              Alterar senha
            </a>
          </Button>
        </div>

        <div className="rounded-md border border-border bg-surface-2 px-3.5 py-3">
          <h3 className="text-[13px] font-semibold">Sair com segurança</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Ao sair, a sessão é encerrada neste dispositivo. Nenhum dado do seu
            espaço fica em cache no navegador.
          </p>
          <form action={signOutAction} className="mt-3">
            <Button
              type="submit"
              variant="outline"
              className="min-h-10 border-danger/30 bg-surface text-danger hover:bg-danger-soft"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair da conta
            </Button>
          </form>
        </div>
      </aside>
    </div>
  );
}
