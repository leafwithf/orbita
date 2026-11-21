import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lightbulb, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { FileMentionText } from "@/components/files/file-mention-text";
import { IdeaActions } from "@/components/ideas/idea-actions";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import { getAppContext } from "@/lib/data/context";
import { listIdeas } from "@/lib/data/ideas";
import { formatDatePtBr } from "@/lib/dates";
import { ideaStateLabel } from "@/modules/ideas/domain";

export const metadata: Metadata = { title: "Ideias e backlog" };

const POTENTIAL_LABELS = {
  low: "Potencial baixo",
  medium: "Potencial médio",
  high: "Potencial alto",
} as const;

export default async function BacklogPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Ideias e backlog"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const workspace = context.workspace;
  const ideas = await listIdeas(workspace.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${ideas.length} ${ideas.length === 1 ? "ideia" : "ideias"}`}
        title="Ideias e backlog"
        description="Um lugar para o que ainda não é projeto. Capturar é rápido; decidir pode esperar."
        actions={
          <Link
            href="/criar?tipo=ideia"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova ideia
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          {ideas.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Nenhuma ideia guardada"
              description="Escreva só o título. Depois você decide se vira projeto, se fica em avaliação ou se não é o momento."
              action={
                <Link
                  href="/criar?tipo=ideia"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Registrar primeira ideia
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-3">
              {ideas.map((idea) => (
                <li
                  key={idea.id}
                  className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-1)]"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusChip
                      label={ideaStateLabel(idea.state)}
                      tone={idea.state === "validated" ? "success" : "neutral"}
                      icon={Sparkles}
                    />
                    {idea.potential ? (
                      <StatusChip
                        label={POTENTIAL_LABELS[idea.potential]}
                        tone={idea.potential === "high" ? "brand" : "neutral"}
                      />
                    ) : null}
                    <span className="ml-auto text-[11px] text-faint">
                      {formatDatePtBr(idea.createdAt.slice(0, 10))}
                    </span>
                  </div>
                  <h3 className="mt-2 text-[15px] leading-snug font-semibold">
                    {idea.title}
                  </h3>
                  {idea.body ? (
                    <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-muted">
                      <FileMentionText workspaceId={workspace.id} text={idea.body} />
                    </p>
                  ) : null}
                  {idea.convertedProjectId ? (
                    <Link
                      href={`/projetos/${idea.convertedProjectId}`}
                      className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand no-underline hover:underline"
                    >
                      Abrir projeto criado
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  ) : null}
                  <IdeaActions ideaId={idea.id} title={idea.title} state={idea.state} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard title="Como o backlog funciona">
            <ol className="grid gap-3 text-[12.5px] leading-relaxed text-muted">
              <li>
                <strong className="text-ink">1. Capture.</strong> Só o título já
                basta. Nada some por ficar parado.
              </li>
              <li>
                <strong className="text-ink">2. Avalie.</strong> Quando fizer
                sentido, marque o potencial e escreva o que falta saber.
              </li>
              <li>
                <strong className="text-ink">3. Decida.</strong> Use “Converter em
                projeto” para criar o projeto com o título e o texto da ideia.
              </li>
            </ol>
          </SectionCard>

          <SectionCard title="Fora do foco ≠ esquecido">
            <p className="text-[12.5px] leading-relaxed text-muted">
              O backlog guarda o que não é prioridade agora. Você pode promover
              uma ideia a qualquer momento, sem culpa e sem apagar o histórico.
            </p>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
