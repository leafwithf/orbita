import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, Clock3, ListChecks, Plus, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { getAppContext } from "@/lib/data/context";
import { listKanbanTasks } from "@/lib/data/tasks";

export const metadata: Metadata = { title: "Quadro de tarefas" };

export default async function KanbanPage() {
  const context = await getAppContext();
  if (!context.workspace) return <div className="rounded-3xl border border-border bg-surface p-7"><h1 className="text-2xl font-semibold">Quadro de tarefas</h1><p className="mt-2 text-sm text-muted">Seu espaço ainda não está disponível. Confira as configurações para começar.</p></div>;

  const tasks = await listKanbanTasks({ workspaceId: context.workspace.id, today: context.today });
  const todo = tasks.filter(task => task.status === "todo").length;
  const progress = tasks.filter(task => task.status === "in_progress").length;
  const done = tasks.filter(task => task.status === "done").length;

  return (
    <div className="grid min-w-0 gap-6">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-28 size-80 rounded-full bg-brand/10 blur-3xl"/>
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[.2em] text-brand uppercase"><Sparkles className="size-3.5"/> Fluxo de trabalho</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-[40px]">Quadro de tarefas<span className="text-brand">.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Veja o trabalho avançar de uma etapa para outra. Arraste no computador ou deslize entre as colunas no celular.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tarefas" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-ink no-underline transition hover:bg-surface-2"><ListChecks className="size-4"/> Lista</Link>
            <Link href="/criar?tipo=tarefa" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline shadow-[0_8px_24px_-12px_var(--brand)] transition hover:-translate-y-0.5 hover:bg-brand-hover"><Plus className="size-4"/> Nova tarefa</Link>
          </div>
        </div>
        <div className="relative mt-7 grid grid-cols-3 gap-3 border-t border-border pt-5 sm:max-w-xl sm:gap-5">
          <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-muted"><Circle className="size-4"/></span><div><p className="text-xl font-semibold tabular-nums">{todo}</p><p className="text-[11px] text-muted">A fazer</p></div></div>
          <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand"><Clock3 className="size-4"/></span><div><p className="text-xl font-semibold tabular-nums">{progress}</p><p className="text-[11px] text-muted">Em andamento</p></div></div>
          <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[var(--success-050)] text-[var(--success-700)]"><CheckCircle2 className="size-4"/></span><div><p className="text-xl font-semibold tabular-nums">{done}</p><p className="text-[11px] text-muted">Concluídas</p></div></div>
        </div>
      </header>

      {tasks.length === 0 ? <div className="rounded-3xl border border-dashed border-border-strong bg-surface p-6 sm:p-9"><EmptyState icon={ListChecks} title="Seu quadro está pronto" description="Crie a primeira tarefa e acompanhe cada etapa até a conclusão." action={<Link href="/criar?tipo=tarefa" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline"><Plus className="size-4"/> Criar primeira tarefa</Link>}/></div> : <KanbanBoard tasks={tasks}/>}
      <div className="flex flex-col justify-between gap-2 rounded-2xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-muted">Tarefas concluídas permanecem no quadro por 14 dias e depois seguem para o histórico.</p><Link href="/historico" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand no-underline">Ver histórico <ArrowUpRight className="size-3.5"/></Link></div>
    </div>
  );
}
