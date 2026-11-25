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
  files: "Arquivo",
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
      <section className="relative isolate overflow-hidden rounded-[28px] border border-brand/25 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_24%,transparent),transparent_55%),linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-8">
      <PageHeader
        title="Lixeira"
        description="Itens excluídos ficam aqui e podem ser restaurados. Itens com mais de 30 dias são removidos de vez pela limpeza diária."
      />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="A lixeira está vazia"
          description="Quando você excluir uma tarefa, ideia ou arquivo, ela aparece aqui."
        />
      ) : (
        <SectionCard title={`${items.length} ${items.length === 1 ? "item" : "itens"}`} bodyClassName="p-0 sm:p-0">
          <ul className="grid gap-3">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="orbita-panel flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-1)] transition hover:border-brand/35 sm:flex-row sm:items-center">
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
                    className="min-h-11 w-full rounded-xl border border-brand/30 bg-surface px-4 text-sm font-semibold text-ink transition hover:border-brand hover:bg-surface-2 sm:w-auto"
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
