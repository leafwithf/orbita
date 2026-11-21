import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight, CalendarDays, Check, CircleAlert, Clock3, FolderKanban,
  GraduationCap, Lightbulb, ListChecks, Plus, Target, TrendingUp, Upload,
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
  focus_changed: "mudou o foco principal", created: "criou", updated: "atualizou",
  completed: "concluiu", archived: "arquivou",
};

export default async function OverviewPage() {
  const context = await getAppContext();
  const name = firstName(contextDisplayName(context));

  if (!context.workspace) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-9">
        <p className="text-xs font-semibold tracking-[.18em] text-brand uppercase">Órbita · espaço</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Olá, {name}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Seu espaço ainda não está disponível. Confira as configurações e as migrações do banco.</p>
        <Link href="/configuracoes" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white no-underline">Abrir configurações</Link>
      </section>
    );
  }

  const data = await getDashboardData({
    workspaceId: context.workspace.id, userId: context.user.id,
    today: context.today, focusScope: context.workspace.focus_scope,
  });
  const todayList = [...data.overdueTasks, ...data.todayTasks].slice(0, 5);
  const overdueCount = data.overdueTasks.length;
  const todayCount = data.todayTasks.length;

  return (
    <div className="grid gap-7">
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[.2em] text-brand uppercase">{formatWeekdayDatePtBr(context.today)}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-[40px]">Olá, {name}<span className="text-brand">.</span></h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{overdueCount ? `Você tem ${overdueCount} tarefa(s) atrasada(s) para revisar.` : todayCount ? `${todayCount} tarefa(s) na sua agenda de hoje. Vamos avançar?` : "Tudo em ordem por aqui. Escolha o que merece sua atenção agora."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/criar?tipo=tarefa" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline shadow-[0_8px_24px_-12px_var(--brand)] transition hover:-translate-y-0.5 hover:bg-brand-hover"><Plus className="size-4"/> Nova tarefa</Link>
          <Link href="/criar?tipo=projeto" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-ink no-underline transition hover:bg-surface-2"><FolderKanban className="size-4"/> Projeto</Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumo da semana">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted">Concluídas na semana</span><span className="grid size-9 place-items-center rounded-xl bg-[var(--success-050)] text-[var(--success-700)]"><Check className="size-4"/></span></div>
          <p className="mt-5 text-4xl font-semibold tracking-tight tabular-nums">{data.stats.completedThisWeek}</p>
          <p className="mt-1 text-xs text-muted">entregas finalizadas</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted">Tarefas criadas</span><span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand"><TrendingUp className="size-4"/></span></div>
          <p className="mt-5 text-4xl font-semibold tracking-tight tabular-nums">{data.stats.createdThisWeek}</p>
          <p className="mt-1 text-xs text-muted">novos passos registrados</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted">Precisam de atenção</span><span className="grid size-9 place-items-center rounded-xl bg-[var(--danger-050)] text-[var(--danger-700)]"><CircleAlert className="size-4"/></span></div>
          <p className="mt-5 text-4xl font-semibold tracking-tight tabular-nums">{data.stats.overdueCount}</p>
          <p className="mt-1 text-xs text-muted">tarefas fora do prazo</p>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,.8fr)]">
        <div className="grid min-w-0 content-start gap-7">
          <section className="overflow-hidden rounded-3xl border border-brand/25 bg-surface shadow-[var(--shadow-1)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[.14em] text-brand uppercase"><Target className="size-4"/> Seu foco principal</div>
              <Link href="/foco" className="text-xs font-semibold text-brand no-underline hover:underline">{data.focusProject ? "Alterar foco" : "Escolher foco"}</Link>
            </div>
            <div className="p-5 sm:p-6">
              {data.focusProject ? <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted">{projectStageLabel(data.focusProject.stage)}</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight"><Link href={`/projetos/${data.focusProject.id}`} className="text-ink no-underline hover:text-brand">{data.focusProject.title}</Link></h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{data.focusProject.objective ?? "Seu projeto em destaque. Mantenha o próximo passo sempre visível."}</p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">{data.focusProject.progress}%</span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-brand transition-all" style={{width:`${data.focusProject.progress}%`}}/></div>
                <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0"><p className="text-[10px] font-semibold tracking-[.15em] text-muted uppercase">Próximo passo</p><p className="mt-1 text-sm font-medium">{data.focusProject.nextStep ?? "Defina a próxima entrega deste projeto."}</p></div>
                  <Link href={`/projetos/${data.focusProject.id}`} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border-strong bg-surface px-3 text-xs font-semibold text-ink no-underline">Abrir projeto <ArrowUpRight className="size-3.5"/></Link>
                </div>
              </> : <div className="py-4"><h2 className="text-xl font-semibold">Escolha onde colocar sua energia</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted">Defina um projeto principal para manter a direção sem perder de vista o restante.</p><Link href="/foco" className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white no-underline">Definir meu foco</Link></div>}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[.18em] text-brand uppercase">Planejamento</p><h2 className="mt-1 text-xl font-semibold tracking-tight">O que vem agora</h2></div><Link href="/tarefas" className="text-xs font-semibold text-brand no-underline hover:underline">Todas as tarefas <ArrowUpRight className="inline size-3.5"/></Link></div>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {todayList.length ? <div className="divide-y divide-border">{todayList.map(task=><TaskRow key={task.id} task={task}/>)}</div> : <div className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center"><span className="grid size-11 place-items-center rounded-2xl bg-[var(--success-050)] text-[var(--success-700)]"><Check className="size-5"/></span><div><p className="font-semibold">Agenda livre por enquanto</p><p className="mt-1 text-sm text-muted">Aproveite para adiantar algo ou registrar uma ideia.</p></div><Link href="/tarefas" className="text-xs font-semibold text-brand no-underline sm:ml-auto">Ver tarefas</Link></div>}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[.18em] text-brand uppercase">Em movimento</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Projetos ativos</h2></div><Link href="/projetos" className="text-xs font-semibold text-brand no-underline hover:underline">Explorar projetos <ArrowUpRight className="inline size-3.5"/></Link></div>
            {data.projects.length ? <div className="grid min-w-0 gap-3 md:grid-cols-2">{data.projects.slice(0,4).map(project=><ProjectCard key={project.id} project={project}/>)}</div> : <ProjectEmptyCard/>}
          </section>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2"><CalendarDays className="size-4 text-brand"/><h2 className="text-sm font-semibold">Próximos prazos</h2></div>
            {data.deadlines.length ? <ul className="mt-4 grid gap-4">{data.deadlines.map(item=><li key={item.id} className="flex gap-3"><span className="flex h-9 min-w-[58px] items-center justify-center rounded-lg bg-surface-2 px-2 text-[11px] font-semibold tabular-nums">{formatShortDatePtBr(item.date)}</span><div className="min-w-0"><p className="text-sm font-medium leading-5">{item.title}</p>{item.context ? <p className="mt-1 text-xs text-muted">{item.context}</p>:null}</div></li>)}</ul> : <p className="mt-3 text-sm leading-6 text-muted">Nenhum prazo próximo. Adicione datas quando fizer sentido.</p>}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2"><GraduationCap className="size-4 text-brand"/><h2 className="text-sm font-semibold">Aprendizado</h2><Link href="/cursos" className="ml-auto text-xs font-semibold text-brand no-underline">Ver cursos</Link></div>
            {data.focusCourse ? <div className="mt-4"><h3 className="font-semibold leading-5">{data.focusCourse.title}</h3><p className="mt-1 text-xs text-muted">{data.focusCourse.platform ?? "Curso em andamento"}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-[var(--success-600)]" style={{width:`${data.focusCourse.progress}%`}}/></div><p className="mt-2 text-xs text-muted">{data.focusCourse.progress}% concluído</p>{data.focusCourse.nextLesson ? <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs leading-5"><span className="font-semibold">Próxima aula · </span>{data.focusCourse.nextLesson}</p>:null}</div> : <p className="mt-3 text-sm leading-6 text-muted">Escolha um curso principal para acompanhar seu progresso de aprendizado.</p>}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[10px] font-semibold tracking-[.18em] text-muted uppercase">Acesso rápido</p>
            <div className="mt-3 grid gap-1">{[{href:"/criar?tipo=ideia",label:"Registrar uma ideia",icon:Lightbulb},{href:"/arquivos",label:"Enviar arquivo",icon:Upload},{href:"/tarefas/quadro",label:"Abrir Kanban",icon:ListChecks},{href:"/foco",label:"Revisar meu foco",icon:Clock3}].map(item=><Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium text-ink no-underline transition hover:bg-surface-2"><item.icon className="size-4 text-brand"/>{item.label}<ArrowUpRight className="ml-auto size-3.5 text-faint"/></Link>)}</div>
          </section>

          {data.activity.length ? <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="text-sm font-semibold">Movimentações recentes</h2><ul className="mt-4 grid gap-3">{data.activity.slice(0,4).map(item=><li key={item.id} className="border-l-2 border-brand/40 pl-3 text-xs leading-5"><span className="font-semibold">{item.actorName ? firstName(item.actorName) : "Alguém"}</span> <span className="text-muted">{VERBS[item.verb] ?? item.verb}</span></li>)}</ul></section> : null}
        </aside>
      </div>
    </div>
  );
}
