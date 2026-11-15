import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Crosshair,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Plus,
  Upload,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { ProgressLine } from "@/components/patterns/progress-line";
import { SectionCard } from "@/components/patterns/section-card";
import { DueDateChip, StatusChip } from "@/components/patterns/status-chip";
import { ProjectCard, ProjectEmptyCard } from "@/components/projects/project-card";
import { TaskRow } from "@/components/tasks/task-row";
import { getAppContext, contextDisplayName } from "@/lib/data/context";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatShortDatePtBr, formatWeekdayDatePtBr } from "@/lib/dates";
import { firstName } from "@/lib/names";
import { projectStageLabel } from "@/modules/projects/domain";

export const metadata: Metadata = { title: "Visão geral" };

const VERB_LABELS: Record<string, string> = {
  focus_changed: "mudou o foco principal",
  created: "criou",
  updated: "atualizou",
  completed: "concluiu",
  archived: "arquivou",
};

export default async function OverviewPage() {
  const context = await getAppContext();
  const name = firstName(contextDisplayName(context));

  if (!context.workspace) {
    return (
      <div className="grid gap-6">
        <PageHeader
          eyebrow={formatWeekdayDatePtBr(context.today)}
          title={`Olá, ${name}`}
          description="Seu espaço ainda não está disponível. Isso costuma acontecer quando as migrações do banco ainda não foram aplicadas."
        />
        <SectionCard title="Preparar meu espaço">
          <p className="text-sm leading-relaxed text-muted">
            Rode as migrações do Supabase (veja o README) e recarregue esta
            página. Se o problema continuar, confira se você é membro ativo de
            algum espaço em Configurações.
          </p>
          <Link
            href="/configuracoes"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover"
          >
            Abrir configurações
          </Link>
        </SectionCard>
      </div>
    );
  }

  const data = await getDashboardData({
    workspaceId: context.workspace.id,
    userId: context.user.id,
    today: context.today,
    focusScope: context.workspace.focus_scope,
  });

  const todayCount = data.todayTasks.length;
  const overdueCount = data.overdueTasks.length;
  const openCount = data.stats.openCount;

  const summary =
    todayCount === 0 && overdueCount === 0
      ? openCount === 0
        ? "Nada vence hoje. Sua lista está em dia — que tal escolher o próximo passo?"
        : `Nada vence hoje. Você tem ${openCount} ${openCount === 1 ? "tarefa aberta" : "tarefas abertas"} para organizar quando quiser.`
      : [
          todayCount > 0
            ? `${todayCount} ${todayCount === 1 ? "tarefa para hoje" : "tarefas para hoje"}`
            : null,
          overdueCount > 0
            ? `${overdueCount} ${overdueCount === 1 ? "atrasada" : "atrasadas"}`
            : null,
        ]
          .filter(Boolean)
          .join(" e ")
          .replace(/^./, (value) => value.toUpperCase()) + ".";

  const todayList = [...data.overdueTasks, ...data.todayTasks].slice(0, 6);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={formatWeekdayDatePtBr(context.today)}
        title={`Olá, ${name}`}
        description={summary}
        actions={
          <>
            <Link
              href="/tarefas"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3.5 text-[13px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
            >
              <ListChecks className="size-4" aria-hidden="true" />
              Ver tarefas
            </Link>
            <Link
              href="/criar?tipo=tarefa"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova tarefa
            </Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <section
            aria-labelledby="foco-principal"
            className="overflow-hidden rounded-lg border border-brand/25 bg-surface shadow-[var(--shadow-1)]"
          >
            <div className="h-1 bg-gradient-to-r from-brand to-[#6f9cf5]" />
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 flex-none place-items-center rounded-[10px] bg-brand-soft text-brand">
                  <Crosshair className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusChip
                      label="Projeto principal"
                      tone="brand"
                      icon={Crosshair}
                    />
                    {data.focusProject ? (
                      <StatusChip
                        label={projectStageLabel(data.focusProject.stage)}
                        tone="neutral"
                      />
                    ) : null}
                  </div>
                  <h2
                    id="foco-principal"
                    className="mt-2 text-[19px] leading-snug font-semibold tracking-[-0.02em]"
                  >
                    {data.focusProject ? (
                      <Link
                        href={`/projetos/${data.focusProject.id}`}
                        className="text-ink no-underline hover:underline"
                      >
                        {data.focusProject.title}
                      </Link>
                    ) : (
                      "Escolha um projeto principal"
                    )}
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    {data.focusProject
                      ? data.focusProject.objective ??
                        "Um projeto por vez para manter a clareza."
                      : "Um foco por vez evita dispersão. Nada é apagado ao trocar: o anterior continua na lista."}
                  </p>
                </div>
                <Link
                  href="/foco"
                  className="hidden h-9 flex-none items-center rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline sm:inline-flex"
                >
                  {data.focusProject ? "Trocar foco" : "Escolher foco"}
                </Link>
              </div>

              {data.focusProject ? (
                <>
                  <div className="mt-4">
                    <ProgressLine progress={data.focusProject.progress} />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-3 sm:flex-row sm:items-center">
                    <ArrowRight
                      className="hidden size-4 flex-none text-brand sm:block"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10.5px] font-semibold tracking-[0.06em] text-faint uppercase">
                        Próximo passo
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug font-medium text-ink">
                        {data.focusProject.nextStep ??
                          "Abra o projeto para definir o próximo passo."}
                      </p>
                    </div>
                    <Link
                      href={`/projetos/${data.focusProject.id}`}
                      className="inline-flex h-9 flex-none items-center justify-center rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
                    >
                      Abrir projeto
                    </Link>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {data.focusProject.dueDate ? (
                      <DueDateChip
                        state={
                          data.focusProject.dueDate < context.today
                            ? "overdue"
                            : data.focusProject.dueDate === context.today
                              ? "today"
                              : "upcoming"
                        }
                      />
                    ) : (
                      <span className="text-[11.5px] text-faint">
                        Sem prazo definido
                      </span>
                    )}
                    <Link
                      href="/foco"
                      className="text-[12px] font-semibold text-brand no-underline hover:underline sm:hidden"
                    >
                      Trocar foco
                    </Link>
                  </div>
                </>
              ) : (
                <Link
                  href="/foco"
                  className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline sm:hidden"
                >
                  Escolher foco
                </Link>
              )}
            </div>
          </section>

          <SectionCard
            title="Hoje"
            description={
              todayList.length > 0
                ? "Comece pelo que vence hoje. Um toque conclui e você pode desfazer."
                : undefined
            }
            action={
              <Link
                href="/tarefas"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand no-underline hover:underline"
              >
                Ver todas <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            }
            bodyClassName="p-0 sm:p-0"
          >
            {todayList.length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyState
                  icon={CheckCircle2}
                  title="Nada vence hoje"
                  description="Sua lista de hoje está limpa. Você pode adiantar algo da semana ou registrar uma ideia."
                  compact
                  action={
                    <Link
                      href="/tarefas"
                      className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-[13px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
                    >
                      Ver próximas tarefas
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {todayList.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </SectionCard>

          <section aria-labelledby="semana" className="grid gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="semana"
                className="text-[15px] font-semibold tracking-[-0.01em]"
              >
                Sua semana
              </h2>
              <span className="text-[11.5px] text-faint">Desde segunda-feira</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-surface px-3.5 py-3">
                <span className="block text-[24px] leading-none font-semibold text-[var(--success-700)] tabular-nums">
                  {data.stats.completedThisWeek}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Concluídas
                </span>
              </div>
              <div className="rounded-md border border-border bg-surface px-3.5 py-3">
                <span className="block text-[24px] leading-none font-semibold tabular-nums">
                  {data.stats.createdThisWeek}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <Plus className="size-3.5" aria-hidden="true" />
                  Criadas
                </span>
              </div>
              <div className="rounded-md border border-border bg-surface px-3.5 py-3">
                <span className="block text-[24px] leading-none font-semibold text-[var(--danger-700)] tabular-nums">
                  {data.stats.overdueCount}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                  Atrasadas
                </span>
              </div>
            </div>
          </section>

          <section aria-labelledby="projetos-andamento" className="grid gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="projetos-andamento"
                className="text-[15px] font-semibold tracking-[-0.01em]"
              >
                Projetos em andamento
              </h2>
              <Link
                href="/projetos"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand no-underline hover:underline"
              >
                Ver todos <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
            {data.projects.length === 0 ? (
              <ProjectEmptyCard />
            ) : (
              <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {data.projects.slice(0, 3).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard
            title="Curso principal"
            action={
              <Link
                href="/cursos"
                className="text-[12.5px] font-semibold text-brand no-underline hover:underline"
              >
                Ver cursos
              </Link>
            }
          >
            {data.focusCourse ? (
              <div className="grid gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-[var(--success-050)] text-[var(--success-700)]">
                    <GraduationCap className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] leading-snug font-semibold">
                      {data.focusCourse.title}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-faint">
                      {[data.focusCourse.platform, data.focusCourse.dueDate ? `prazo ${formatShortDatePtBr(data.focusCourse.dueDate)}` : null]
                        .filter(Boolean)
                        .join(" · ") || "Sem plataforma definida"}
                    </p>
                  </div>
                </div>
                <ProgressLine
                  progress={{
                    completedWeight: data.focusCourse.progress,
                    totalWeight: 100,
                    percent: data.focusCourse.progress,
                    label: `${data.focusCourse.progress}% concluído`,
                  }}
                />
                {data.focusCourse.nextLesson ? (
                  <div className="flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5">
                    <ArrowRight
                      className="mt-0.5 size-3.5 flex-none text-brand"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[10.5px] font-semibold tracking-[0.06em] text-faint uppercase">
                        Próxima aula
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-snug font-medium">
                        {data.focusCourse.nextLesson}
                      </p>
                    </div>
                  </div>
                ) : null}
                <Link
                  href="/cursos"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
                >
                  Continuar curso
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="Nenhum curso principal"
                description="Escolha um curso para manter o estudo visível, sem competir com o projeto principal."
                compact
                action={
                  <Link
                    href="/cursos"
                    className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-[13px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
                  >
                    Escolher curso
                  </Link>
                }
              />
            )}
          </SectionCard>

          <SectionCard
            title="Próximos prazos"
            action={
              <Link
                href="/tarefas"
                className="text-[12.5px] font-semibold text-brand no-underline hover:underline"
              >
                Ver
              </Link>
            }
          >
            {data.deadlines.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-muted">
                Nenhum prazo definido. Você pode trabalhar sem data ou adicionar
                um prazo quando fizer sentido.
              </p>
            ) : (
              <ul className="grid gap-3">
                {data.deadlines.map((deadline) => (
                  <li key={deadline.id} className="flex items-start gap-2.5">
                    <span className="inline-flex min-h-7 flex-none items-center rounded-full border border-border bg-surface-2 px-2 text-[11px] font-semibold text-muted tabular-nums">
                      {formatShortDatePtBr(deadline.date)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] leading-snug font-medium">
                        {deadline.title}
                      </p>
                      {deadline.context ? (
                        <p className="mt-0.5 text-[11px] text-faint">
                          {deadline.context}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Atalhos">
            <div className="grid gap-2">
              <Link
                href="/criar?tipo=tarefa"
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-medium text-ink no-underline hover:bg-surface-2 hover:no-underline"
              >
                <Plus className="size-4 text-brand" aria-hidden="true" />
                Nova tarefa
              </Link>
              <Link
                href="/criar?tipo=ideia"
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-medium text-ink no-underline hover:bg-surface-2 hover:no-underline"
              >
                <Lightbulb className="size-4 text-brand" aria-hidden="true" />
                Registrar ideia
              </Link>
              <Link
                href="/arquivos"
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-medium text-ink no-underline hover:bg-surface-2 hover:no-underline"
              >
                <Upload className="size-4 text-brand" aria-hidden="true" />
                Enviar arquivo
              </Link>
              <Link
                href="/espacos"
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[13px] font-medium text-ink no-underline hover:bg-surface-2 hover:no-underline"
              >
                <Users className="size-4 text-brand" aria-hidden="true" />
                Convidar pessoa
              </Link>
            </div>
          </SectionCard>

          {data.activity.length > 0 ? (
            <SectionCard title="Atividade recente">
              <ul className="grid gap-3">
                {data.activity.slice(0, 4).map((item) => (
                  <li key={item.id} className="text-[12.5px] leading-relaxed">
                    <span className="font-semibold">
                      {item.actorName ? firstName(item.actorName) : "Alguém"}
                    </span>{" "}
                    <span className="text-muted">
                      {VERB_LABELS[item.verb] ?? item.verb}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-faint">
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(item.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <p className="flex items-center gap-2 px-1 text-[11.5px] leading-relaxed text-faint">
            <CalendarDays className="size-3.5 flex-none" aria-hidden="true" />
            Datas no fuso {context.timeZone.replace("_", " ")}. Tarefas sem prazo
            não somem: ficam em “Sem prazo”.
          </p>
        </aside>
      </div>
    </div>
  );
}
