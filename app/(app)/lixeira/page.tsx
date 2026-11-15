import type { Metadata } from "next";
import { Trash2 } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { restoreItemFormAction } from "@/lib/actions/mvp";
import { getAppContext } from "@/lib/data/context";
import { listTrash } from "@/lib/data/search";
import { formatDateTimePtBr } from "@/lib/dates";

export const metadata: Metadata = { title: "Lixeira" };

const KIND_LABELS = {
  projects: "Projeto",
  tasks: "Tarefa",
  ideas: "Ideia",
  courses: "Curso",
} as const;

export default async function TrashPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Lixeira"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const items = await listTrash(context.workspace.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Lixeira"
        description="Itens excluídos ficam aqui e podem ser restaurados. A limpeza automática em 30 dias chega junto com os arquivos (Etapa 5)."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="A lixeira está vazia"
          description="Quando você excluir uma tarefa ou ideia, ela aparece aqui."
        />
      ) : (
        <SectionCard title={`${items.length} ${items.length === 1 ? "item" : "itens"}`} bodyClassName="p-0 sm:p-0">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{item.title}</p>
                  <p className="text-[11.5px] text-faint">
                    {KIND_LABELS[item.kind]} · excluído em {formatDateTimePtBr(item.deletedAt)}
                  </p>
                </div>
                <form action={restoreItemFormAction}>
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    aria-label={`Restaurar ${item.title}`}
                    className="min-h-11 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2"
                  >
                    Restaurar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
