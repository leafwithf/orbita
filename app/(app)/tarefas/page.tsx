import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ListChecks, Plus } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { TaskRow } from "@/components/tasks/task-row";
import { getAppContext } from "@/lib/data/context";
import { listTasks } from "@/lib/data/tasks";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tarefas" };

const VIEWS = [
  { id: "abertas", label: "Em aberto" },
  { id: "semana", label: "Próximos 7 dias" },
  { id: "todas", label: "Todas" },
  { id: "concluidas", label: "Concluídas" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function addDaysIso(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const context = await getAppContext();
  const params = await searchParams;
  const view: ViewId = VIEWS.some((entry) => entry.id === params.vista)
    ? (params.vista as ViewId)
    : "abertas";

  if (!context.workspace) {
    return (
      <PageHeader
        title="Tarefas"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const tasks = await listTasks({
    workspaceId: context.workspace.id,
    today: context.today,
    includeDone: view === "concluidas" || view === "todas",
  });

  const weekLimit = addDaysIso(context.today, 7);
  const filtered = tasks.filter((task) => {
    if (view === "concluidas") return task.status === "done";
    if (view === "semana") {
      return (
        task.status !== "done" &&
        Boolean(task.dueDate) &&
        (task.dueDate as string) <= weekLimit
      );
    }
    if (view === "todas") return true;
    return task.status !== "done";
  });

  const overdue = filtered.filter(
    (task) => task.status !== "done" && task.dueState === "overdue",
  );
  const today = filtered.filter(
    (task) => task.status !== "done" && task.dueState === "today",
  );
  const upcoming = filtered.filter(
    (task) => task.status !== "done" && task.dueState === "upcoming",
  );
  const noDate = filtered.filter(
    (task) => task.status !== "done" && task.dueState === "none",
  );
  const done = filtered.filter((task) => task.status === "done");

  const groups = [
    { id: "atrasadas", title: "Atrasadas", tasks: overdue },
    { id: "hoje", title: "Vencem hoje", tasks: today },
    { id: "proximas", title: "Próximas", tasks: upcoming },
    { id: "sem-prazo", title: "Sem prazo", tasks: noDate },
    { id: "concluidas", title: "Concluídas recentemente", tasks: done },
  ].filter((group) => group.tasks.length > 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${filtered.length} ${filtered.length === 1 ? "tarefa" : "tarefas"} nesta vista`}
        title="Tarefas"
        description="Atrasada, vence hoje ou sem prazo: cada tarefa mostra o estado por extenso, nunca só por cor."
        actions={
          <Link
            href="/criar?tipo=tarefa"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova tarefa
          </Link>
        }
      />

      <nav aria-label="Filtros de tarefas" className="flex flex-wrap gap-2">
        {VIEWS.map((entry) => {
          const active = entry.id === view;
          return (
            <Link
              key={entry.id}
              href={`/tarefas?vista=${entry.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full border px-3.5 text-[12.5px] font-semibold no-underline transition-colors",
                active
                  ? "border-brand bg-brand text-white hover:bg-brand-hover hover:no-underline"
                  : "border-border-strong bg-surface text-ink hover:bg-surface-2 hover:no-underline",
              )}
            >
              {entry.label}
            </Link>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <EmptyState
          icon={view === "concluidas" ? CheckCircle2 : ListChecks}
          title={
            view === "concluidas"
              ? "Nenhuma tarefa concluída ainda"
              : view === "semana"
                ? "Nada nos próximos 7 dias"
                : "Nenhuma tarefa nesta vista"
          }
          description={
            view === "concluidas"
              ? "Quando você concluir uma tarefa, ela continua aqui como histórico. Nada desaparece."
              : "Crie uma tarefa com prazo ou registre uma ideia para não perder o que passou pela cabeça."
          }
          action={
            <Link
              href="/criar?tipo=tarefa"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Criar tarefa
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5">
          {groups.map((group) => (
            <SectionCard
              key={group.id}
              title={`${group.title} · ${group.tasks.length}`}
              bodyClassName="p-0 sm:p-0"
            >
              <div className="divide-y divide-border">
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
