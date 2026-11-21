"use client";

import Link from "next/link";
import { ChevronDown, FolderKanban } from "lucide-react";

type ProjectOption = { id: string; title: string; emoji: string; status: string };

export function ProjectSwitcher({
  currentProjectId,
  projects,
}: {
  currentProjectId: string;
  projects: ProjectOption[];
}) {
  const current = projects.find((project) => project.id === currentProjectId);
  const others = projects.filter((project) => project.id !== currentProjectId);

  return (
    <details className="group relative">
      <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-surface px-3 text-[12.5px] font-semibold text-ink transition-colors hover:border-border-strong hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <FolderKanban className="size-4 text-brand" aria-hidden="true" />
        <span className="max-w-[min(42vw,180px)] truncate">{current?.emoji ?? "🚀"} {current?.title ?? "Projeto atual"}</span>
        <ChevronDown className="size-3.5 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 z-40 mt-2 w-[min(340px,calc(100vw-2rem))] max-h-80 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-[var(--shadow-2)]">
        <p className="px-2 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-faint uppercase">Projeto atual</p>
        <div className="flex items-center gap-2 rounded-md bg-brand-soft px-2.5 py-2 text-[13px] font-semibold text-ink">
          <span className="text-lg">{current?.emoji ?? "🚀"}</span>
          <span className="min-w-0 flex-1 truncate">{current?.title ?? "Projeto atual"}</span>
          <span className="text-[10px] font-semibold text-brand">ATUAL</span>
        </div>
        <p className="px-2 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-faint uppercase">Outros projetos · {others.length}</p>
        {others.length ? (
          <div className="grid gap-1">
            {others.map((project) => (
              <Link
                key={project.id}
                href={`/projetos/${project.id}`}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-ink no-underline transition-colors hover:bg-surface-2 hover:no-underline"
              >
                <span className="text-lg">{project.emoji || "🚀"}</span>
                <span className="min-w-0 flex-1 truncate">{project.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-2 py-3 text-[12px] text-muted">Não há outros projetos neste espaço.</p>
        )}
        <Link href="/projetos" className="mt-2 block border-t border-border px-2.5 pt-2.5 text-[12px] font-semibold text-brand no-underline hover:underline">
          Ver todos os projetos
        </Link>
      </div>
    </details>
  );
}
