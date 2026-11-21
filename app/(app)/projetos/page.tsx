import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CirclePause, FolderKanban, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { getAppContext } from "@/lib/data/context";
import { listProjects } from "@/lib/data/projects";

export const metadata: Metadata = { title: "Projetos" };

export default async function ProjectsPage() {
  const context = await getAppContext();
  if (!context.workspace) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-7">
        <h1 className="text-2xl font-semibold">Projetos</h1>
        <p className="mt-2 text-sm text-muted">Seu espaço ainda não está disponível. Confira as configurações para começar.</p>
      </section>
    );
  }

  const projects = await listProjects({ workspaceId: context.workspace.id, today: context.today });
  const active = projects.filter((project) => project.status === "active");
  const paused = projects.filter((project) => project.status === "paused");
  const completed = projects.filter((project) => project.status === "completed");

  return (
    <div className="grid min-w-0 gap-7">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div>
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-brand">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-soft"><FolderKanban className="size-3.5" /></span>
            Seu espaço / Projetos
          </div>
          <h1 className="max-w-3xl text-[34px] font-semibold leading-[1.04] tracking-[-.055em] sm:text-[46px]">
            Ideias ganham forma.<br className="hidden sm:block" /> Projetos ganham <span className="text-brand">movimento.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
            Um panorama das iniciativas do seu espaço, do primeiro passo à entrega final.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
          <div>
            <p className="text-xs font-medium text-muted">Pronto para tirar uma ideia do papel?</p>
            <p className="mt-1 text-sm font-semibold">Comece um novo projeto</p>
          </div>
          <Link href="/criar?tipo=projeto" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline shadow-[0_8px_24px_-12px_var(--brand)] transition hover:-translate-y-0.5 hover:bg-brand-hover">
            <Plus className="size-4" /> Novo projeto
          </Link>
        </div>
      </header>

      <section aria-label="Resumo dos projetos" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Todos os projetos" value={projects.length} detail="No seu espaço" icon={<FolderKanban className="size-4" />} />
        <SummaryTile label="Em andamento" value={active.length} detail="Em execução" accent icon={<Sparkles className="size-4" />} />
        <SummaryTile label="Em pausa" value={paused.length} detail="Aguardando retomada" icon={<CirclePause className="size-4" />} />
        <SummaryTile label="Concluídos" value={completed.length} detail="Entregas finalizadas" icon={<CheckCircle2 className="size-4" />} />
      </section>

      {projects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-strong bg-surface p-5 sm:p-8">
          <EmptyState
            icon={FolderKanban}
            title="Seu primeiro projeto começa aqui"
            description="Crie um espaço para uma ideia, uma meta ou uma entrega. Depois, reúna tarefas, arquivos e pessoas no mesmo lugar."
            action={<Link href="/criar?tipo=projeto" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline"><Plus className="size-4" /> Criar primeiro projeto</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-9">
          {active.length > 0 && (
            <ProjectSection title="Em movimento" subtitle="O que está recebendo atenção agora" count={active.length} tone="brand">
              <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {active.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            </ProjectSection>
          )}
          {paused.length > 0 && (
            <ProjectSection title="Em espera" subtitle="Iniciativas que podem ser retomadas" count={paused.length}>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {paused.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            </ProjectSection>
          )}
          {completed.length > 0 && (
            <ProjectSection title="Conquistas" subtitle="O que já saiu do plano e virou entrega" count={completed.length}>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {completed.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            </ProjectSection>
          )}
        </div>
      )}

      <Link href="/tarefas/quadro" className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 text-sm no-underline transition hover:border-brand/40 hover:bg-surface-2">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><ArrowRight className="size-4" /></span>
          <span className="min-w-0"><span className="block font-semibold text-ink">Veja o trabalho no Kanban</span><span className="mt-1 block text-xs text-muted">Acompanhe tarefas e entregas por etapa.</span></span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" />
      </Link>
    </div>
  );
}

function SummaryTile({ label, value, detail, icon, accent = false }: { label: string; value: number; detail: string; icon: ReactNode; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-muted">{label}</span>
        <span className={accent ? "text-brand" : "text-faint"}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-.045em] tabular-nums">{value}</p>
      <p className="mt-1 text-[10.5px] text-muted">{detail}</p>
    </div>
  );
}

function ProjectSection({ title, subtitle, count, tone = "neutral", children }: { title: string; subtitle: string; count: number; tone?: "brand" | "neutral"; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-[-.025em]">{title}</h2>
            <span className={tone === "brand" ? "rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand" : "rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted"}>{count}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
