import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, EyeOff, Globe2, Link2, Lock, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import { getAppContext } from "@/lib/data/context";
import { listPortfolioEntries } from "@/lib/data/portfolio";
import { formatDatePtBr } from "@/lib/dates";

export const metadata: Metadata = { title: "Portfólio" };

const VISIBILITY_LABELS = {
  private: "Privado",
  unlisted: "Link não listado",
  public: "Público",
} as const;

export default async function PortfolioPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Portfólio"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const entries = await listPortfolioEntries(context.workspace.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Privado por padrão"
        title="Portfólio"
        description="Mostre seu trabalho sem abrir o espaço inteiro. Cada projeto publicado tem seu próprio link."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <SectionCard
            title={`Publicações · ${entries.length}`}
            description="O portfólio nunca expõe tarefas, arquivos internos ou dados de outras pessoas."
          >
            {entries.length === 0 ? (
              <EmptyState
                icon={Globe2}
                title="Nenhum projeto publicado"
                description="Seu espaço é privado. Quando quiser, escolha um projeto e crie um link não listado com token — revogável a qualquer momento."
                compact
                action={
                  <Link
                    href="/projetos"
                    className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-4 text-[13px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
                  >
                    Ver meus projetos
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {entries.map((entry) => (
                  <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusChip
                        label={VISIBILITY_LABELS[entry.visibility]}
                        tone={entry.visibility === "private" ? "neutral" : "brand"}
                        icon={
                          entry.visibility === "private" ? Lock : Link2
                        }
                      />
                      {entry.revokedAt ? (
                        <StatusChip label="Revogado" tone="danger" />
                      ) : null}
                      {entry.publishedAt ? (
                        <span className="ml-auto text-[11px] text-faint">
                          {formatDatePtBr(entry.publishedAt.slice(0, 10))}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 text-[14px] font-semibold">
                      {entry.projectTitle}
                    </h3>
                    {entry.summary ? (
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                        {entry.summary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="O link não listado">
            <div className="grid gap-3 text-[12.5px] leading-relaxed text-muted">
              <p className="flex items-start gap-2.5">
                <Link2 className="mt-0.5 size-4 flex-none text-brand" aria-hidden="true" />
                Quem tem o link e o token consegue abrir. Não aparece em buscadores
                e a resposta inclui <code className="rounded bg-surface-2 px-1">noindex</code>.
              </p>
              <p className="flex items-start gap-2.5">
                <EyeOff className="mt-0.5 size-4 flex-none text-brand" aria-hidden="true" />
                O token fica só como hash no banco. Revogar invalida o link
                imediatamente, sem apagar o projeto.
              </p>
              <p className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 flex-none text-brand" aria-hidden="true" />
                O projeto continua privado no app. Publicar é uma decisão
                separada e reversível.
              </p>
            </div>
          </SectionCard>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard title="Nesta fase">
            <p className="text-[12.5px] leading-relaxed text-muted">
              A estrutura de publicações e tokens já existe no banco. A criação e
              a revogação de links entram com a tela de portfólio do MVP.
            </p>
          </SectionCard>

          <SectionCard title="Privacidade por padrão">
            <p className="text-[12.5px] leading-relaxed text-muted">
              Nenhum projeto é público até você escolher. O portfólio é um recorte
              curado, não uma cópia do espaço de trabalho.
            </p>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
