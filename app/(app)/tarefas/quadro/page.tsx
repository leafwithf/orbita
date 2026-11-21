import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Circle, Clock3, ListChecks, Plus } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { getAppContext } from "@/lib/data/context";
import { listKanbanTasks } from "@/lib/data/tasks";

export const metadata: Metadata = { title: "Quadro de tarefas" };

export default async function KanbanPage() {
  const context = await getAppContext();
  if (!context.workspace) {
    return <section className="rounded-3xl border border-border bg-surface p-7"><h1 className="text-2xl font-semibold">Quadro de tarefas</h1><p className="mt-2 text-sm text-muted">Seu espaço ainda não está disponível. Confira as configurações para começar.</p></section>;
  }

  const tasks = await listKanbanTasks({ workspaceId: context.workspace.id, today: context.today });
  const todo = tasks.filter((task) => task.status === "todo").length;
  const progress = tasks.filter((task) => task.status === "in_progress").length;
  const done = tasks.filter((task) => task.status === "done").length;
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="grid min-w-0 gap-6">
      <header className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
        <div>
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-brand">
            <span className="grid size-7 place-items-center rounded-lg bg-brand-soft"><ListChecks className="size-3.5" /></span>
            Seu espaço / Execução
          </div>
          <h1 className="text-[34px] font-semibold leading-[1.04] tracking-[-.055em] sm:text-[46px]">O próximo passo<br className="hidden sm:block" /> está <span className="text-brand">no quadro.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">Organize o fluxo, identifique bloqueios e mova cada entrega até a linha de chegada.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/tarefas" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-ink no-underline transition hover:bg-surface-2"><ListChecks className="size-4" /> Ver lista</Link>
            <Link href="/criar?tipo=tarefa" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline shadow-[0_8px_24px_-12px_var(--brand)] transition hover:-translate-y-0.5 hover:bg-brand-hover"><Plus className="size-4" /> Nova tarefa</Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-medium text-muted">Ritmo de conclusão</p><p className="mt-1 text-3xl font-semibold tracking-[-.045em] tabular-nums">{completion}<span className="text-base text-muted">%</span></p></div>
            <div className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Check className="size-6" /></div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${completion}%` }} /></div>
          <p className="mt-2 text-[11px] text-muted">{done} de {tasks.length} tarefas concluídas</p>
        </aside>
      </header>

      <section aria-label="Resumo das tarefas" className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatusSummary label="A fazer" value={todo} icon={<Circle className="size-4" />} />
        <StatusSummary label="Em andamento" value={progress} icon={<Clock3 className="size-4" />} accent />
        <StatusSummary label="Concluídas" value={done} icon={<Check className="size-4" />} success />
      </section>

      {tasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-strong bg-surface p-6 sm:p-9">
          <EmptyState icon={ListChecks} title="Seu quadro está pronto" description="Crie a primeira tarefa e acompanhe cada etapa até a conclusão." action={<Link href="/criar?tipo=tarefa" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline"><Plus className="size-4" /> Criar primeira tarefa</Link>} />
        </div>
      ) : <KanbanBoard tasks={tasks} />}

      <div className="flex flex-col justify-between gap-2 rounded-2xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center">
        <p className="text-xs leading-5 text-muted">Tarefas concluídas permanecem no quadro por 14 dias e depois seguem para o histórico.</p>
        <Link href="/historico" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand no-underline">Ver histórico <ArrowUpRight className="size-3.5" /></Link>
      </div>
    </div>
  );
}

function StatusSummary({ label, value, icon, accent = false, success = false }: { label: string; value: number; icon: React.ReactNode; accent?: boolean; success?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-3.5 sm:gap-3 sm:px-4">
      <span className={success ? "grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--success-050)] text-[var(--success-700)]" : accent ? "grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand" : "grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted"}>{icon}</span>
      <span className="min-w-0"><span className="block text-xl font-semibold tabular-nums">{value}</span><span className="block truncate text-[10px] text-muted sm:text-[11px]">{label}</span></span>
    </div>
  );
}
