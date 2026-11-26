import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FolderKanban } from "lucide-react";

import { ProgressLine } from "@/components/patterns/progress-line";
import { DueDateChip } from "@/components/patterns/status-chip";
import { projectStageLabel } from "@/modules/projects/domain";
import type { DueDateState, Progress } from "@/modules/tasks/domain";

/** Shared shape for the full project list and the dashboard summary. */
type ProjectCardData = {
  id: string;
  title: string;
  emoji?: string;
  coverUrl?: string | null;
  objective: string | null;
  stage: string;
  dueDate: string | null;
  dueState: DueDateState;
  progress: Progress;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link
      href={`/projetos/${project.id}`}
      data-stage={project.stage}
      className="orbita-panel orbita-project group flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 text-ink no-underline shadow-[var(--shadow-1)] transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:bg-surface-2 hover:shadow-[var(--shadow-2)] hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="orbita-orbit-badge grid size-11 flex-none place-items-center overflow-hidden rounded-full border border-border bg-surface-2 text-[23px]"
            aria-hidden="true"
          >
            {project.coverUrl ? <Image src={project.coverUrl} alt="" width={44} height={44} sizes="44px" className="size-full object-cover" /> : project.emoji ?? "🚀"}
          </span>
          <div className="min-w-0 pt-0.5">
            <h3 className="line-clamp-2 text-[14px] leading-snug font-semibold tracking-[-0.015em] sm:text-[15px]">
              {project.title}
            </h3>
            <p className="mt-1 text-[10.5px] font-medium tracking-[.04em] text-faint uppercase">
              {projectStageLabel(project.stage)}
            </p>
          </div>
        </div>
        <span className="grid size-8 flex-none place-items-center rounded-full text-muted transition-colors group-hover:bg-brand-soft group-hover:text-brand">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </div>

      {project.objective ? (
        <p className="mt-3 line-clamp-2 min-h-9 text-[12.5px] leading-relaxed text-muted">
          {project.objective}
        </p>
      ) : (
        <p className="mt-3 min-h-9 text-[12px] text-faint">Adicione um objetivo para orientar este projeto.</p>
      )}

      <div className="mt-auto border-t border-border pt-4">
        <ProgressLine progress={project.progress} />
        <div className="mt-3 flex items-center justify-between gap-2">
          {project.dueDate ? (
            <DueDateChip state={project.dueState} />
          ) : (
            <span className="text-[11.5px] text-faint">Sem prazo definido</span>
          )}
          <span className="text-[11px] font-semibold text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Abrir projeto
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectEmptyCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-2/50 px-5 py-9 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
        <FolderKanban className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-[15px] font-semibold">Nenhum projeto em andamento</h3>
      <p className="mt-1 max-w-[38ch] text-[13px] leading-relaxed text-muted">
        Comece com uma ideia simples. Um projeto reúne tarefas, prazos e o
        próximo passo em um só lugar.
      </p>
      <Link
        href="/criar?tipo=projeto"
        className="orbita-cta mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-brand-hover hover:no-underline"
      >
        Criar meu primeiro projeto
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
