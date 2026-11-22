import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, FolderKanban, PauseCircle, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { getAppContext } from "@/lib/data/context";
import { listProjects } from "@/lib/data/projects";

export const metadata: Metadata = { title: "Projetos" };

export default async function ProjectsPage() {
  const context = await getAppContext();
  if (!context.workspace) return <div className="rounded-3xl border border-border bg-surface p-7"><h1 className="text-2xl font-semibold">Projetos</h1><p className="mt-2 text-sm text-muted">Seu espaço ainda não está disponível. Confira as configurações para começar.</p></div>;

  const projects = await listProjects({ workspaceId: context.workspace.id, today: context.today });
  const active = projects.filter(project => project.status === "active");
  const paused = projects.filter(project => project.status === "paused");
  const completed = projects.filter(project => project.status === "completed");

  return (
    <div className="grid gap-7">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-surface/95 p-5 shadow-[var(--shadow-1)] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full bg-brand/10 blur-3xl"/>
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[.2em] text-brand uppercase"><Sparkles className="size-3.5"/> Central de projetos</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-[40px]">Transforme planos em entregas<span className="text-brand">.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Organize iniciativas, acompanhe o progresso e mantenha cada próximo passo visível em um só lugar.</p>
          </div>
          <Link href="/criar?tipo=projeto" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white no-underline shadow-[0_8px_24px_-12px_var(--brand)] transition hover:-translate-y-0.5 hover:bg-brand-hover"><Plus className="size-4"/> Novo projeto</Link>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-2 border-t border-border pt-5 sm:max-w-xl sm:gap-4">
          <div><p className="text-2xl font-semibold tabular-nums">{projects.length}</p><p className="mt-1 text-[11px] text-muted">No total</p></div>
          <div><p className="text-2xl font-semibold tabular-nums">{active.length}</p><p className="mt-1 text-[11px] text-muted">Em andamento</p></div>
          <div><p className="text-2xl font-semibold tabular-nums">{completed.length}</p><p className="mt-1 text-[11px] text-muted">Concluídos</p></div>
        </div>
      </header>

      {projects.length === 0 ? <div className="rounded-3xl border border-dashed border-border-strong bg-surface p-5 sm:p-8"><EmptyState icon={FolderKanban} title="Seu próximo projeto começa aqui" description="Crie um espaço para uma ideia, uma meta ou uma entrega. Depois, reúna tarefas, arquivos e pessoas no mesmo lugar." action={<Link href="/criar?tipo=projeto" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline"><Plus className="size-4"/> Criar primeiro projeto</Link>}/></div> : <div className="grid gap-8">
        {active.length ? <section className="grid gap-4" aria-labelledby="active-projects">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-brand-soft text-brand"><FolderKanban className="size-4"/></span><div><h2 id="active-projects" className="text-base font-semibold">Em andamento</h2><p className="text-xs text-muted">{active.length} {active.length === 1 ? "projeto ativo" : "projetos ativos"}</p></div></div><span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{active.length}</span></div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">{active.map(project=><ProjectCard key={project.id} project={project}/>)}</div>
        </section> : null}
        {paused.length ? <section className="grid gap-4" aria-labelledby="paused-projects"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-surface-2 text-muted"><PauseCircle className="size-4"/></span><div><h2 id="paused-projects" className="text-base font-semibold">Em pausa</h2><p className="text-xs text-muted">Projetos que podem ser retomados</p></div></div><div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">{paused.map(project=><ProjectCard key={project.id} project={project}/>)}</div></section> : null}
        {completed.length ? <section className="grid gap-4" aria-labelledby="completed-projects"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-[var(--success-050)] text-[var(--success-700)]"><CheckCircle2 className="size-4"/></span><div><h2 id="completed-projects" className="text-base font-semibold">Concluídos</h2><p className="text-xs text-muted">Entregas finalizadas e registradas</p></div></div><div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-3">{completed.map(project=><ProjectCard key={project.id} project={project}/>)}</div></section> : null}
      </div>}
      <Link href="/tarefas/quadro" className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4 text-sm no-underline transition hover:border-brand/40 hover:bg-surface-2"><span><span className="block font-semibold text-ink">Acompanhe suas entregas no Kanban</span><span className="mt-1 block text-xs text-muted">Veja tarefas e andamento em um quadro visual.</span></span><ArrowUpRight className="size-5 shrink-0 text-brand"/></Link>
    </div>
  );
}
