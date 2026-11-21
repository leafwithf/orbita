import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";

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
      className="group flex min-w-0 flex-col rounded-lg border border-border bg-surface p-4 text-ink no-underline shadow-[var(--shadow-1)] transition-colors hover:border-border-strong hover:bg-surface-2 hover:no-underline"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className="grid size-9 flex-none place-items-center rounded-lg border border-border bg-surface-2 text-xl"
            aria-hidden="true"
          >
            {project.coverUrl ? <img src={project.coverUrl} alt="" className="size-9 rounded-lg object-cover" /> : project.emoji ?? "🚀"}
          </span>
          <h3 className="min-w-0 pt-1 text-[15px] leading-snug font-semibold tracking-[-0.01em]">
            {project.title}
          </h3>
        </div>
        <span className="mt-0.5 flex-none text-[11px] font-medium whitespace-nowrap text-faint">
          {projectStageLabel(project.stage)}
        </span>
      </div>

      {project.objective ? (
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
          {project.objective}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <ProgressLine progress={project.progress} />
        <div className="mt-2 flex items-center justify-between gap-2">
          {project.dueDate ? (
            <DueDateChip state={project.dueState} />
          ) : (
            <span className="text-[11.5px] text-faint">Sem prazo</span>
          )}
          <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Abrir <ArrowRight className="size-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectEmptyCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-2/60 px-5 py-8 text-center">
      <span className="mb-3 grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
        <FolderKanban className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-[15px] font-semibold">Nenhum projeto em andamento</h3>
      <p className="mt-1 max-w-[38ch] text-[13px] leading-relaxed text-muted">
        Comece com uma ideia simples. Um projeto reúne tarefas, prazos e o
        próximo passo em um só lugar.
      </p>
      <Link
        href="/criar?tipo=projeto"
        className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
      >
        Criar meu primeiro projeto
      </Link>
    </div>
  );
}
