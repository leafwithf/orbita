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
      <PageHeader
        title="Histórico"
        description="O que aconteceu no seu espaço, do mais recente ao mais antigo. Edições simples e mudanças de ordem não entram."
      />

      {events.length === 0 ? (
        <EmptyState
          icon={History}
          title="Ainda não há histórico"
          description="Criar, concluir, arquivar ou converter algo aparece aqui automaticamente."
        />
      ) : (
        <SectionCard title={`Últimos ${events.length} eventos`} bodyClassName="p-0 sm:p-0">
          <ol className="divide-y divide-border">
            {events.map((event) => {
              const mine = event.actorId === context.user.id;
              const text = describeActivity(
                event.verb,
                event.title,
                mine ? "Você" : "Alguém",
              );
              const href = (HREF[event.entityType] ?? (() => "/"))(event.entityId);
              return (
                <li key={event.id} className="flex flex-wrap items-baseline gap-x-3 px-4 py-3">
                  <Link href={href} className="text-[13.5px] text-ink no-underline hover:underline">
                    {text}
                  </Link>
                  <time dateTime={event.createdAt} className="ml-auto text-[11.5px] text-faint">
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
