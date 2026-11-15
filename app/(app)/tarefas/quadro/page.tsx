import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { getAppContext } from "@/lib/data/context";
import { listKanbanTasks } from "@/lib/data/tasks";

export const metadata: Metadata = { title: "Quadro de tarefas" };

export default async function KanbanPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Quadro de tarefas"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const tasks = await listKanbanTasks({
    workspaceId: context.workspace.id,
    today: context.today,
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"} no quadro`}
        title="Quadro de tarefas"
        description="Mova com os botões de seta (teclado, leitor de tela e celular). Concluídas ficam 14 dias aqui; depois seguem no histórico."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tarefas"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3.5 text-[13px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
            >
              <ListChecks className="size-4" aria-hidden="true" />
              Ver como lista
            </Link>
            <Link
              href="/criar?tipo=tarefa"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova tarefa
            </Link>
          </div>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="O quadro está vazio"
          description="Crie uma tarefa para ela aparecer na coluna “A fazer”."
        />
      ) : (
        <KanbanBoard tasks={tasks} />
      )}
    </div>
  );
}
