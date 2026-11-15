"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/auth/form-message";
import { SelectField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { completeOnboardingAction } from "@/lib/actions/profile";
import { initialFormState } from "@/lib/actions/state";
import { TIMEZONES, TIMEZONE_LABELS } from "@/modules/profile/domain";

export function OnboardingForm({
  fullName,
  timezone,
}: {
  fullName: string;
  timezone: string;
}) {
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage
        status={state.status === "error" ? "error" : "success"}
        message={state.message}
      />

      <TextField
        id="fullName"
        name="fullName"
        label="Como você quer ser chamado"
        defaultValue={fullName}
        autoComplete="name"
        autoFocus
        required
        maxLength={120}
        error={state.fieldErrors?.fullName?.[0]}
        hint="É o nome que aparece nas tarefas e no seu perfil."
      />

      <SelectField
        id="timezone"
        name="timezone"
        label="Seu fuso horário"
        defaultValue={timezone}
        required
        error={state.fieldErrors?.timezone?.[0]}
        hint="Usamos para dizer o que vence hoje. Prazos continuam sendo datas, não horários."
      >
        {TIMEZONES.map((zone) => (
          <option key={zone} value={zone}>
            {TIMEZONE_LABELS[zone]}
          </option>
        ))}
      </SelectField>

      <SubmitButton pending={pending} pendingLabel="Preparando seu espaço…">
        Entrar no meu espaço
      </SubmitButton>

      <p className="text-[11.5px] leading-relaxed text-faint">
        Você poderá mudar essas informações depois em Configurações. Nada é
        compartilhado sem você convidar alguém.
      </p>
    </form>
  );
}
