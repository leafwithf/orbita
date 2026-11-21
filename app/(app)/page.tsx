import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, CalendarDays, Check, CircleAlert, Clock3,
  FolderKanban, GraduationCap, Lightbulb, ListChecks, Plus, Sparkles,
  Target, TrendingUp, Upload,
} from "lucide-react";

import { ProjectCard, ProjectEmptyCard } from "@/components/projects/project-card";
import { TaskRow } from "@/components/tasks/task-row";
import { getAppContext, contextDisplayName } from "@/lib/data/context";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatShortDatePtBr, formatWeekdayDatePtBr } from "@/lib/dates";
import { firstName } from "@/lib/names";
import { projectStageLabel } from "@/modules/projects/domain";

export const metadata: Metadata = { title: "Visão geral" };

const VERBS: Record<string, string> = {
  focus_changed: "mudou o foco principal",
  created: "criou",
  updated: "atualizou",
  completed: "concluiu",
  archived: "arquivou",
};

function Metric({
  label,
  value,
  note,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof Check;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass = tone === "success"
    ? "bg-emerald-500/10 text-emerald-600"
    : tone === "warning"
      ? "bg-amber-500/10 text-amber-600"
      : "bg-brand-soft text-brand";

  return (
    <article className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/80 bg-surface p-4 sm:p-5">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-muted">{label}</p>
        <p className="mt-0.5 text-[26px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="mt-1 truncate text-[10px] text-faint">{note}</p>
      </div>
    </article>
  );
}

export default async function OverviewPage() {
  const context = await getAppContext();
  const name = firstName(contextDisplayName(context));

  if (!context.workspace) {
    return (
      <section className="rounded-[28px] border border-border bg-surface p-7 sm:p-10">
        <p className="text-[10px] font-bold tracking-[.2em] text-brand uppercase">Órbita / espaço</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Olá, {name}.</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Seu espaço ainda não está disponível. Confira as configurações e as migrações do banco.</p>
        <Link href="/configuracoes" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white no-underline">Abrir configurações</Link>
      </section>
    );
  }

  const data = await getDashboardData({
    workspaceId: context.workspace.id,
    userId: context.user.id,
    today: context.today,
    focusScope: context.workspace.focus_scope,
  });

  const todayList = [...data.overdueTasks, ...data.todayTasks].slice(0, 5);
  const overdueCount = data.overdueTasks.length;
  const todayCount = data.todayTasks.length;
  const focusProgress = data.focusProject?.progress.percent ?? 0;

  return (
    <div className="grid gap-6 pb-4 sm:gap-8">
      <header className="relative isolate overflow-hidden rounded-[28px] bg-[#111827] px-5 py-6 text-white shadow-[0_18px_50px_-28px_rgba(15,23,42,.55)] sm:px-8 sm:py-8 xl:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 size-[360px] rounded-full bg-[var(--brand)]/20 blur-[90px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-[34%] size-[300px] rounded-full border border-white/[.07]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-[38%] size-[220px] rounded-full border border-white/[.06]" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-[.17em] text-white/55 uppercase">
              <span className="size-1.5 rounded-full bg-[var(--brand)]" />
              {formatWeekdayDatePtBr(context.today)}
              <span className="text-white/25">/</span>
              {context.workspace.name}
            </div>
            <h1 className="mt-5 text-[34px] leading-[1.04] font-semibold tracking-[-.055em] text-white sm:text-5xl">
              Vamos fazer<br className="hidden sm:block" /> acontecer, <span className="text-[var(--brand)]">{name}.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/65">
              {overdueCount
                ? `Há ${overdueCount} tarefa(s) que precisam da sua atenção. Vamos reorganizar o caminho?`
                : todayCount
                  ? `${todayCount} tarefa(s) estão no seu radar hoje. Um passo de cada vez.`
                  : "Seu espaço está pronto. Escolha uma prioridade e comece a movimentar seus planos."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/criar?tipo=tarefa" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-[#171717] no-underline transition hover:-translate-y-0.5 hover:brightness-110">
                <Plus className="size-4" /> Nova tarefa
              </Link>
              <Link href="/criar?tipo=projeto" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 text-sm font-semibold text-white no-underline transition hover:bg-white/[.12]">
                <FolderKanban className="size-4" /> Criar projeto
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-white/50">Concluídas na semana</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{data.stats.completedThisWeek}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-300"><TrendingUp className="size-3" /> entregas finalizadas</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-white/50">Fora do prazo</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{data.stats.overdueCount}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-200"><CircleAlert className="size-3" /> atenção necessária</div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Indicadores da semana">
        <Metric label="Tarefas criadas" value={data.stats.createdThisWeek} note="novos passos registrados" icon={Plus} />
        <Metric label="Entregas concluídas" value={data.stats.completedThisWeek} note="nesta semana" icon={Check} tone="success" />
        <Metric label="Precisam de atenção" value={data.stats.overdueCount} note="tarefas atrasadas" icon={CircleAlert} tone="warning" />
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.8fr)]">
        <div className="grid min-w-0 content-start gap-6">
          <section className="overflow-hidden rounded-[26px] border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold tracking-[.16em] text-brand uppercase">Direção da semana</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">Projeto em foco</h2>
              </div>
              <Link href="/foco" className="inline-flex items-center gap-1 text-xs font-semibold text-brand no-underline hover:underline">
                {data.focusProject ? "Trocar foco" : "Definir foco"} <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {data.focusProject ? (
              <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center sm:p-7">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold text-brand">{projectStageLabel(data.focusProject.stage)}</span>
                    <span className="text-[10px] text-faint">Projeto prioritário</span>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[28px]">
                    <Link href={`/projetos/${data.focusProject.id}`} className="text-ink no-underline hover:text-brand">{data.focusProject.title}</Link>
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{data.focusProject.objective ?? "Seu projeto em destaque. Mantenha o próximo passo sempre visível."}</p>
                  <div className="mt-5 rounded-2xl bg-background p-4">
                    <p className="text-[9px] font-bold tracking-[.14em] text-faint uppercase">Próxima ação</p>
                    <p className="mt-1 text-sm font-medium">{data.focusProject.nextStep ?? "Defina a próxima entrega deste projeto."}</p>
                    <Link href={`/projetos/${data.focusProject.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand no-underline">Abrir projeto <ArrowRight className="size-3.5" /></Link>
                  </div>
                </div>
                <div className="mx-auto grid size-36 place-items-center rounded-full" style={{ background: `conic-gradient(var(--brand) ${focusProgress * 3.6}deg, var(--border) 0deg)` }}>
                  <div className="grid size-[118px] place-content-center rounded-full bg-surface text-center">
                    <span className="text-3xl font-semibold tracking-tight tabular-nums">{focusProgress}%</span>
                    <span className="mt-1 text-[9px] font-semibold tracking-[.12em] text-faint uppercase">concluído</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Target className="size-5" /></div>
                <h3 className="mt-4 text-xl font-semibold">Escolha sua próxima grande entrega</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted">Defina um projeto principal para manter sua energia direcionada e acompanhar o progresso em um só lugar.</p>
                <Link href="/foco" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-xs font-bold text-white no-underline">Definir meu foco <ArrowRight className="size-3.5" /></Link>
              </div>
            )}
          </section>

          <section className="grid gap-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <div><p className="text-[10px] font-bold tracking-[.16em] text-brand uppercase">Execução</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Sua agenda</h2><p className="mt-1 text-xs text-muted">O que merece atenção agora</p></div>
              <Link href="/tarefas" className="text-xs font-semibold text-brand no-underline hover:underline">Ver tudo <ArrowUpRight className="inline size-3.5" /></Link>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-border bg-surface">
              {todayList.length ? <div className="divide-y divide-border">{todayList.map(task => <TaskRow key={task.id} task={task} />)}</div> : (
                <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600"><Check className="size-5" /></span>
                  <div><p className="font-semibold">Nenhuma pendência para hoje</p><p className="mt-1 text-sm text-muted">Sua agenda está livre. Aproveite para planejar o próximo movimento.</p></div>
                  <Link href="/tarefas" className="text-xs font-semibold text-brand no-underline sm:ml-auto">Abrir tarefas</Link>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4">
            <div className="flex items-end justify-between gap-3 px-1">
              <div><p className="text-[10px] font-bold tracking-[.16em] text-brand uppercase">Construção</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Projetos em movimento</h2></div>
              <Link href="/projetos" className="text-xs font-semibold text-brand no-underline hover:underline">Todos os projetos <ArrowUpRight className="inline size-3.5" /></Link>
            </div>
            {data.projects.length
              ? <div className="grid min-w-0 gap-3 md:grid-cols-2">{data.projects.slice(0, 4).map(project => <ProjectCard key={project.id} project={project} />)}</div>
              : <ProjectEmptyCard />}
          </section>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <section className="rounded-[22px] border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><CalendarDays className="size-4 text-brand" /><h2 className="text-sm font-semibold">Próximos prazos</h2></div><span className="text-[10px] text-faint">{data.deadlines.length} no radar</span></div>
            {data.deadlines.length ? <ul className="mt-4 grid gap-3">{data.deadlines.map(item => <li key={item.id} className="flex gap-3 rounded-xl bg-background p-3"><span className="flex h-10 min-w-[54px] flex-col items-center justify-center rounded-lg bg-surface text-[10px] font-bold tabular-nums"><span>{formatShortDatePtBr(item.date)}</span></span><div className="min-w-0"><p className="text-xs leading-5 font-semibold">{item.title}</p>{item.context ? <p className="mt-0.5 text-[10px] text-muted">{item.context}</p> : null}</div></li>)}</ul> : <p className="mt-3 text-sm leading-6 text-muted">Nenhum prazo próximo. Adicione datas quando fizer sentido.</p>}
          </section>

          <section className="rounded-[22px] border border-border bg-surface p-5">
            <div className="flex items-center gap-2"><GraduationCap className="size-4 text-brand" /><h2 className="text-sm font-semibold">Trilha de aprendizado</h2><Link href="/cursos" className="ml-auto text-[10px] font-semibold text-brand no-underline">Ver cursos</Link></div>
            {data.focusCourse ? <div className="mt-4"><h3 className="text-sm font-semibold leading-5">{data.focusCourse.title}</h3><p className="mt-1 text-[11px] text-muted">{data.focusCourse.platform ?? "Curso em andamento"}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${data.focusCourse.progress}%` }} /></div><p className="mt-2 text-[10px] text-muted">{data.focusCourse.progress}% concluído</p>{data.focusCourse.nextLesson ? <p className="mt-3 rounded-xl bg-background p-3 text-xs leading-5"><span className="font-semibold">Próxima aula · </span>{data.focusCourse.nextLesson}</p> : null}</div> : <p className="mt-3 text-sm leading-6 text-muted">Escolha um curso principal para acompanhar seu progresso.</p>}
          </section>

          <section className="rounded-[22px] border border-border bg-surface p-5">
            <p className="text-[10px] font-bold tracking-[.16em] text-faint uppercase">Atalhos</p>
            <div className="mt-3 grid gap-1">
              {[
                { href: "/criar?tipo=ideia", label: "Capturar uma ideia", icon: Lightbulb },
                { href: "/arquivos", label: "Enviar arquivo", icon: Upload },
                { href: "/tarefas/quadro", label: "Abrir Kanban", icon: ListChecks },
                { href: "/foco", label: "Revisar meu foco", icon: Clock3 },
              ].map(item => <Link key={item.href} href={item.href} className="group flex min-h-11 items-center gap-3 rounded-xl px-2 text-xs font-medium text-ink no-underline transition hover:bg-background"><span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand"><item.icon className="size-4" /></span>{item.label}<ArrowUpRight className="ml-auto size-3.5 text-faint transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}
            </div>
          </section>

          {data.activity.length ? <section className="rounded-[22px] border border-border bg-surface p-5"><h2 className="text-sm font-semibold">Atividade recente</h2><ul className="mt-4 grid gap-3">{data.activity.slice(0, 4).map(item => <li key={item.id} className="border-l-2 border-brand/50 pl-3 text-xs leading-5"><span className="font-semibold">{item.actorName ? firstName(item.actorName) : "Alguém"}</span> <span className="text-muted">{VERBS[item.verb] ?? item.verb}</span></li>)}</ul></section> : null}
        </aside>
      </div>
    </div>
  );
}
