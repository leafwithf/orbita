import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  ArchiveRestore,
  Bell,
  Database,
  Download,
  Info,
  Lock,
  ShieldAlert,
} from "lucide-react";

import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import { ProfileForm } from "@/components/settings/profile-form";
import { ThemePreference } from "@/components/settings/theme-preference";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAppContext } from "@/lib/data/context";

export const metadata: Metadata = { title: "Configurações" };

const NOTIFICATION_PREVIEW = [
  {
    title: "Prazo vence hoje",
    description: "Um resumo pela manhã, não um alerta por tarefa.",
  },
  {
    title: "Tarefa atrasada",
    description: "Aparece no painel; e-mail só se ficar dois dias atrasada.",
  },
  {
    title: "Convites e novos membros",
    description: "Quando alguém aceita um convite do seu espaço.",
  },
  {
    title: "Resumo semanal",
    description: "Segunda-feira, com o que foi concluído e o que vem.",
  },
];

export default async function SettingsPage() {
  const context = await getAppContext();
  const email = context.user.email ?? "conta sem e-mail";
  const fullName =
    context.profile?.full_name?.trim() || email.split("@")[0] || "Você";
  const timezone = context.profile?.timezone || "America/Sao_Paulo";

  return (
    <div className="grid gap-7">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 size-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-brand">Conta e preferências</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-[40px]">Seu espaço, suas regras<span className="text-brand">.</span></h1>
          <p className="mt-3 text-sm leading-6 text-muted">Gerencie seus dados, personalize a experiência e controle como o Órbita acompanha seu trabalho.</p>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-muted">
          <span className="rounded-full bg-surface-2 px-3 py-1.5">Perfil: {fullName}</span>
          <span className="rounded-full bg-surface-2 px-3 py-1.5">Fuso: {timezone}</span>
        </div>
      </header>

      {!context.profile ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-md border border-warning/35 bg-warning-soft px-3.5 py-3 text-[12.5px] leading-relaxed text-ink"
        >
          <Info
            className="mt-0.5 size-4 flex-none text-[var(--warning-700)]"
            aria-hidden="true"
          />
          Seu perfil ainda não foi criado no banco. Rode as migrações do
          Supabase e recarregue a página antes de salvar.
        </div>
      ) : null}

      <Tabs defaultValue="perfil" className="gap-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList
            aria-label="Seções de configuração"
            className="h-auto min-h-11 w-max rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow-1)]"
          >
            <TabsTrigger value="perfil" className="min-h-9 rounded-lg px-4">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="aparencia" className="min-h-9 rounded-lg px-4">
              Aparência
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="min-h-9 rounded-lg px-4">
              Notificações
            </TabsTrigger>
            <TabsTrigger value="privacidade" className="min-h-9 rounded-lg px-4">
              Privacidade e dados
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="perfil">
          <SectionCard
            title="Seus dados"
            description="O essencial para o app falar com você do jeito certo."
          >
            <ProfileForm
              fullName={fullName}
              timezone={timezone}
              email={email}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="aparencia" className="grid gap-5">
          <SectionCard title="Aparência">
            <ThemePreference />
          </SectionCard>

          <SectionCard title="Acessibilidade">
            <ul className="grid gap-3 text-[12.5px] leading-relaxed text-muted">
              <li className="flex items-start gap-2.5">
                <Accessibility
                  className="mt-0.5 size-4 flex-none text-brand"
                  aria-hidden="true"
                />
                Alvos de toque têm pelo menos 44 px, foco visível em todos os
                controles e status nunca dependem só de cor.
              </li>
              <li className="flex items-start gap-2.5">
                <Info
                  className="mt-0.5 size-4 flex-none text-brand"
                  aria-hidden="true"
                />
                A interface segue a preferência de reduzir animações do sistema.
                Aumentar o texto e ampliar alvos ficam para a revisão de
                acessibilidade do MVP.
              </li>
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="notificacoes">
          <SectionCard
            title="Notificações"
            description="Sem excesso: você escolhe o que interrompe."
            action={<StatusChip label="Internas no MVP" tone="neutral" />}
          >
            <ul className="grid gap-3">
              {NOTIFICATION_PREVIEW.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-2.5 rounded-md border border-border bg-surface-2 px-3.5 py-3"
                >
                  <Bell
                    className="mt-0.5 size-4 flex-none text-faint"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[13px] font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-[11.5px] leading-relaxed text-faint">
              <Info className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
              As preferências de notificação entram junto com o envio de e-mail e
              as notificações internas. Nada é ativado sem você escolher.
            </p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="privacidade" className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Seus dados">
            <p className="text-[12.5px] leading-relaxed text-muted">
              Você pode levar tudo com você. A exportação inclui projetos,
              tarefas, notas, histórico e links para os arquivos.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled
                className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold text-faint opacity-70"
              >
                <Download className="size-4" aria-hidden="true" />
                Exportar meus dados
              </button>
              <span className="text-[11.5px] text-faint">
                Disponível antes do lançamento.
              </span>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                <ArchiveRestore
                  className="size-4 text-brand"
                  aria-hidden="true"
                />
                Lixeira
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                Itens excluídos ficam recuperáveis por 30 dias. Nada é apagado
                de imediato.
              </p>
              <Link
                href="/projetos"
                className="mt-2 inline-flex min-h-9 items-center text-[12px] font-semibold text-brand no-underline hover:underline"
              >
                Ver meus projetos
              </Link>
            </div>
          </SectionCard>

          <div className="grid content-start gap-5">
            <SectionCard title="Privacidade">
              <ul className="grid gap-2 text-[12.5px] leading-relaxed text-muted">
                <li className="flex items-start gap-2">
                  <Lock
                    className="mt-0.5 size-3.5 flex-none text-brand"
                    aria-hidden="true"
                  />
                  Coletamos só o necessário para operar sua conta.
                </li>
                <li className="flex items-start gap-2">
                  <Database
                    className="mt-0.5 size-3.5 flex-none text-brand"
                    aria-hidden="true"
                  />
                  Seus dados não são usados para treinar modelos.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert
                    className="mt-0.5 size-3.5 flex-none text-brand"
                    aria-hidden="true"
                  />
                  Você pode pedir a exclusão da conta a qualquer momento.
                </li>
              </ul>
              <p className="mt-3 border-t border-border pt-3 text-[11.5px] leading-relaxed text-faint">
                Política de privacidade e termos de uso entram antes da abertura
                do alpha.
              </p>
            </SectionCard>

            <SectionCard
              title="Zona de risco"
              className="border-danger/30"
            >
              <p className="text-[12.5px] leading-relaxed text-muted">
                Excluir a conta remove seus espaços pessoais após 30 dias.
                Espaços compartilhados precisam de outro proprietário.
              </p>
              <button
                type="button"
                disabled
                className="mt-3 inline-flex min-h-10 cursor-not-allowed items-center rounded-md border border-danger/25 bg-danger-soft px-3 text-[12.5px] font-semibold text-[var(--danger-700)] opacity-70"
              >
                Solicitar exclusão da conta
              </button>
              <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
                A solicitação com confirmação por e-mail chega com o fluxo de
                conta do MVP.
              </p>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
