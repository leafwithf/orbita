import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  FolderKanban,
  GraduationCap,
  ListChecks,
} from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getProfile, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Bem-vindo" };

// Depends on the session cookie; never prerender this onboarding screen.
export const dynamic = "force-dynamic";

const FIRST_STEPS = [
  {
    icon: Crosshair,
    title: "Um foco por vez",
    description:
      "Um projeto principal e um curso principal. O resto continua disponível, sem sumir.",
  },
  {
    icon: ListChecks,
    title: "O próximo passo sempre visível",
    description:
      "A visão geral mostra o que fazer agora, sem exigir que você monte um método.",
  },
  {
    icon: FolderKanban,
    title: "Nada é apagado por acidente",
    description:
      "Trocas e arquivamentos explicam o que acontece. Exclusões vão para a lixeira.",
  },
  {
    icon: GraduationCap,
    title: "Estudo também é trabalho",
    description:
      "Cursos ficam ao lado dos projetos, com progresso transparente e sem culpa.",
  },
];

export default async function WelcomePage() {
  const user = await requireUser("/bem-vindo");
  const profile = await getProfile(user.id);

  if (profile?.onboarding_done_at) {
    redirect("/");
  }

  const email = user.email ?? "";
  const suggestedName =
    profile?.full_name?.trim() || email.split("@")[0] || "";

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/bem-vindo"
          className="inline-flex items-center gap-2.5 text-ink no-underline"
          aria-label="ÓRBITA"
        >
          <span className="grid size-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#2c6be0] to-[#1d4fb8] text-white">
            <LogoMark className="size-5" />
          </span>
          <span className="grid leading-tight">
            <span className="text-[14px] font-bold tracking-[0.14em]">
              ÓRBITA
            </span>
            <span className="text-[11px] text-faint">seu espaço de trabalho</span>
          </span>
        </Link>
        <span className="text-[12px] text-muted">{email}</span>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 pt-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-start lg:gap-12 lg:pt-10">
        <section className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--brand-700)]">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Conta confirmada
          </p>
          <h1 className="mt-3 text-[30px] leading-tight font-semibold tracking-[-0.03em] sm:text-[38px]">
            Bem-vindo à ÓRBITA.
          </h1>
          <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-muted">
            Antes de começar, diga como quer ser chamado e qual é o seu fuso
            horário. Leva menos de um minuto.
          </p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {FIRST_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="rounded-lg border border-border bg-surface px-3.5 py-3 shadow-[var(--shadow-1)]"
                >
                  <span className="grid size-9 place-items-center rounded-[10px] bg-brand-soft text-brand">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h2 className="mt-2.5 text-[13.5px] font-semibold">
                    {step.title}
                  </h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 flex items-start gap-2 text-[12px] leading-relaxed text-faint">
            <ArrowRight className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
            Depois deste passo, você cai na visão geral com o próximo passo
            sugerido. Não precisa configurar nada antes de criar sua primeira
            tarefa.
          </p>
        </section>

        <section
          aria-labelledby="onboarding-titulo"
          className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-2)] sm:p-6"
        >
          <h2
            id="onboarding-titulo"
            className="text-[17px] font-semibold tracking-[-0.01em]"
          >
            Seu primeiro passo
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            Você pode mudar tudo depois em Configurações.
          </p>
          <div className="mt-4">
            <OnboardingForm
              fullName={suggestedName}
              timezone={profile?.timezone || "America/Sao_Paulo"}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
