import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { listActivity } from "@/lib/data/activity";
import { getAppContext } from "@/lib/data/context";
import { formatDateTimePtBr } from "@/lib/dates";
import { describeActivity } from "@/modules/tasks/kanban";

export const metadata: Metadata = { title: "Histórico" };

const HREF: Record<string, (id: string | null) => string> = {
  project: (id) => (id ? `/projetos/${id}` : "/projetos"),
  task: () => "/tarefas/quadro",
  idea: () => "/backlog",
  course: () => "/cursos",
};

export default async function HistoryPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Histórico"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const events = await listActivity(context.workspace.id);

  return (
    <div className="grid gap-6">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-brand/25 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_24%,transparent),transparent_55%),linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-8">
      <PageHeader
        title="Histórico"
        description="O que aconteceu no seu espaço, do mais recente ao mais antigo. Edições simples e mudanças de ordem não entram."
      />
      </section>

      {events.length === 0 ? (
        <EmptyState
          icon={History}
          title="Ainda não há histórico"
          description="Criar, concluir, arquivar ou converter algo aparece aqui automaticamente."
        />
      ) : (
        <SectionCard title={`Últimos ${events.length} eventos`} bodyClassName="p-0 sm:p-0">
          <ol className="grid gap-3">
            {events.map((event) => {
              const mine = event.actorId === context.user.id;
              const text = describeActivity(
                event.verb,
                event.title,
                mine ? "Você" : "Alguém",
              );
              const href = (HREF[event.entityType] ?? (() => "/"))(event.entityId);
              return (
                <li key={event.id} className="orbita-panel flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-1)] transition hover:border-brand/35 sm:flex-row sm:items-center sm:gap-3">
                  <Link href={href} className="min-w-0 text-sm font-medium leading-relaxed text-ink no-underline hover:text-brand hover:underline">
                    {text}
                  </Link>
                  <time dateTime={event.createdAt} className="text-xs text-faint sm:ml-auto">
                    {formatDateTimePtBr(event.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        </SectionCard>
      )}
    </div>
  );
}
