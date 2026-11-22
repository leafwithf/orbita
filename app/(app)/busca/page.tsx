import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { getAppContext } from "@/lib/data/context";
import { searchWorkspace, type SearchHit } from "@/lib/data/search";
import { MIN_SEARCH_LENGTH, normalizeSearchQuery } from "@/modules/tasks/kanban";

export const metadata: Metadata = { title: "Busca" };

const TYPE_LABELS: Record<SearchHit["entityType"], string> = {
  project: "Projetos",
  task: "Tarefas",
  idea: "Ideias",
  course: "Cursos",
};

const HREF: Record<SearchHit["entityType"], (id: string) => string> = {
  project: (id) => `/projetos/${id}`,
  task: () => "/tarefas/quadro",
  idea: () => "/backlog",
  course: () => "/cursos",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const context = await getAppContext();
  const { q = "" } = await searchParams;
  const query = normalizeSearchQuery(q);

  const hits =
    context.workspace && query
      ? await searchWorkspace(context.workspace.id, query)
      : [];

  const groups = (Object.keys(TYPE_LABELS) as SearchHit["entityType"][])
    .map((type) => ({ type, items: hits.filter((hit) => hit.entityType === type) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-7">
<section className="relative isolate overflow-hidden rounded-[28px] border border-brand/25 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_24%,transparent),transparent_55%),linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-8">
      <PageHeader
        title="Busca"
        description="Procura em ideias, projetos, tarefas e cursos do seu espaço. Não diferencia maiúsculas nem acentos."
      />
    </section>

      <form role="search" action="/busca" method="get" className="flex flex-col gap-3 rounded-3xl border border-brand/25 bg-surface p-3 shadow-[var(--shadow-2)] sm:flex-row sm:items-center sm:p-4">
        <label htmlFor="q" className="sr-only">
          Buscar no espaço
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          minLength={MIN_SEARCH_LENGTH}
          maxLength={80}
          placeholder="Ex.: site, copy, hábitos"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-border bg-surface-2 px-4 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-sm font-semibold text-white shadow-[var(--shadow-1)] transition hover:bg-brand-hover"
        >
          <Search className="size-4" aria-hidden="true" />
          Buscar
        </button>
      </form>

      {!q ? null : !query ? (
        <p className="text-[13px] text-muted" role="status">
          Digite pelo menos {MIN_SEARCH_LENGTH} caracteres.
        </p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`Nada encontrado para “${query}”`}
          description="Tente outra palavra ou menos termos. Itens na lixeira ou arquivados não aparecem."
        />
      ) : (
        <div className="grid gap-6" role="status" aria-live="polite">
          <p className="text-[12.5px] text-muted">
            {hits.length} {hits.length === 1 ? "resultado" : "resultados"} para “{query}”
          </p>
          {groups.map((group) => (
            <SectionCard
              key={group.type}
              title={`${TYPE_LABELS[group.type]} · ${group.items.length}`}
              bodyClassName="p-0 sm:p-0"
            >
              <ul className="grid gap-2">
                {group.items.map((hit) => (
                  <li key={`${hit.entityType}-${hit.id}`}>
                    <Link
                      href={HREF[hit.entityType](hit.id)}
                      className="block rounded-2xl border border-border bg-surface p-4 no-underline shadow-[var(--shadow-1)] transition hover:border-brand/40 hover:bg-surface-2 hover:no-underline"
                    >
                      <span className="block text-[14px] font-medium text-ink">
                        {hit.title}
                      </span>
                      {hit.snippet ? (
                        <span className="mt-0.5 block text-[12.5px] text-muted">
                          {hit.snippet}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
