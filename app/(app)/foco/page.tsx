import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crosshair,
  FolderKanban,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { ProgressLine } from "@/components/patterns/progress-line";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import { SetFocusButton } from "@/components/focus/set-focus-button";
import { TaskRow } from "@/components/tasks/task-row";
import { getAppContext } from "@/lib/data/context";
import { getFocusState } from "@/lib/data/focus";
import { listProjects } from "@/lib/data/projects";
import { listCourses } from "@/lib/data/courses";
import { listTasks } from "@/lib/data/tasks";
import { formatShortDatePtBr } from "@/lib/dates";
import { projectStageLabel } from "@/modules/projects/domain";

export const metadata: Metadata = { title: "Meu foco" };

export default async function FocusPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Meu foco"
          description="Seu espaço ainda não está pronto. Rode as migrações do Supabase para começar."
        />
      </div>
    );
  }

  const workspaceId = context.workspace.id;
  const [projects, courses, focus, tasks] = await Promise.all([
    listProjects({ workspaceId, today: context.today }),
    listCourses({ workspaceId, today: context.today }),
    getFocusState({
      workspaceId,
      userId: context.user.id,
      focusScope: context.workspace.focus_scope,
    }),
    listTasks({ workspaceId, today: context.today }),
  ]);

  const focusProject =
    projects.find((project) => project.id === focus.projectId) ?? null;
  const focusCourse =
    courses.find((course) => course.id === focus.courseId) ?? null;
  const otherProjects = projects.filter(
    (project) => project.id !== focus.projectId,
  );
  const otherCourses = courses.filter((course) => course.id !== focus.courseId);

  const todayQueue = tasks
    .filter((task) => task.dueState === "overdue" || task.dueState === "today")
    .slice(0, 6);

  return (
    <div className="grid gap-6">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-brand/25 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_24%,transparent),transparent_55%),linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-8">
      <PageHeader
        eyebrow="Uma decisão por vez"
        title="Meu foco"
        description="Um projeto e um curso por vez. O resto continua disponível, sem ser apagado."
        actions={
          <StatusChip
            label="1 projeto · 1 curso por espaço"
            tone="neutral"
            icon={Lock}
          />
        }
      />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <section
            aria-labelledby="projeto-principal"
            className="relative isolate overflow-hidden rounded-[28px] border border-brand/30 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_20%,transparent),transparent_58%),linear-gradient(145deg,var(--surface),var(--surface-2))] shadow-[var(--shadow-2)]"
          >
            <div className="h-1.5 bg-gradient-to-r from-brand via-[#f26a1b] to-[#ffc857]" />
            <div className="p-4 sm:p-5">
              {focusProject ? (
                <>
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
                        <StatusChip
                          label={projectStageLabel(focusProject.stage)}
                          tone="neutral"
                        />
                      </div>
                      <h2
                        id="projeto-principal"
                        className="mt-2 text-[19px] leading-snug font-semibold tracking-[-0.02em]"
                      >
                        <Link
                          href={`/projetos/${focusProject.id}`}
                          className="text-ink no-underline hover:underline"
                        >
                          {focusProject.title}
                        </Link>
                      </h2>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">
                        {focusProject.objective ?? "Sem objetivo escrito ainda."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProgressLine progress={focusProject.progress} />
                  </div>

                  <div className="mt-5 rounded-2xl border border-brand/30 bg-brand-soft p-4 shadow-[var(--shadow-1)] sm:p-5">
                    <p className="text-[10.5px] font-semibold tracking-[0.06em] text-[var(--brand-700)] uppercase">
                      Seu próximo passo
                    </p>
                    <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <p className="min-w-0 flex-1 text-[13px] leading-relaxed font-medium">
                        {focusProject.nextStep ??
                          "Abra o projeto e escreva o próximo passo em uma frase."}
                      </p>
                      <Link
                        href={`/projetos/${focusProject.id}`}
                        className="inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-md bg-brand px-3 text-[12.5px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
                      >
                        Começar
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div id="projeto-principal">
                  <EmptyState
                    icon={Crosshair}
                    title="Escolha seu projeto principal"
                    description="Ele aparece na visão geral e no seu dia. Você pode trocar quando quiser — o projeto anterior não é apagado."
                    action={
                      otherProjects[0] ? (
                        <SetFocusButton
                          workspaceId={workspaceId}
                          kind="project"
                          targetId={otherProjects[0].id}
                          targetTitle={otherProjects[0].title}
                          currentTitle={null}
                        />
                      ) : (
                        <Link
                          href="/criar?tipo=projeto"
                          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
                        >
                          Criar meu primeiro projeto
                        </Link>
                      )
                    }
                  />
                </div>
              )}
            </div>
          </section>

          <SectionCard
            title="Fila de hoje"
            description="Atrasadas primeiro, depois o que vence hoje."
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
            {todayQueue.length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyState
                  icon={CheckCircle2}
                  title="Fila do dia zerada"
                  description="Nada atrasado e nada vencendo hoje. Você pode escolher uma tarefa da semana ou descansar."
                  compact
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {todayQueue.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </SectionCard>

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
            {focusCourse ? (
              <div className="grid gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-[var(--success-050)] text-[var(--success-700)]">
                    <BookOpen className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14.5px] leading-snug font-semibold">
                      {focusCourse.title}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-faint">
                      {[
                        focusCourse.platform,
                        focusCourse.moduleCount > 0
                          ? `${focusCourse.doneModules} de ${focusCourse.moduleCount} módulos`
                          : null,
                        focusCourse.dueDate
                          ? `prazo ${formatShortDatePtBr(focusCourse.dueDate)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Sem detalhes ainda"}
                    </p>
                  </div>
                  <StatusChip
                    label={`${focusCourse.progress}%`}
                    tone="success"
                  />
                </div>
                <ProgressLine
                  progress={{
                    completedWeight: focusCourse.progress,
                    totalWeight: 100,
                    percent: focusCourse.progress,
                    label: "Progresso registrado do curso",
                  }}
                />
                {focusCourse.nextLesson ? (
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
                        {focusCourse.nextLesson}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Nenhum curso principal"
                description="Estudar também é foco. Escolha um curso para acompanhar o progresso sem disputar atenção com o projeto."
                compact
                action={
                  otherCourses[0] ? (
                    <SetFocusButton
                      workspaceId={workspaceId}
                      kind="course"
                      targetId={otherCourses[0].id}
                      targetTitle={otherCourses[0].title}
                      currentTitle={null}
                    />
                  ) : undefined
                }
              />
            )}
          </SectionCard>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard title="Trocar o foco">
            <p className="text-[12.5px] leading-relaxed text-muted">
              Só pode existir um projeto principal. Ao trocar, o anterior volta
              para a lista com todas as tarefas, arquivos e notas. Nada é
              apagado.
            </p>

            <div className="mt-4 grid gap-2">
              <h3 className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
                Outros projetos
              </h3>
              {otherProjects.length === 0 ? (
                <p className="text-[12.5px] text-muted">
                  Nenhum outro projeto disponível. Crie um para poder alternar.
                </p>
              ) : (
                otherProjects.slice(0, 6).map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-1)] transition hover:border-brand/30 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">
                        {project.title}
                      </p>
                      <p className="text-[11px] text-faint">
                        {projectStageLabel(project.stage)} ·{" "}
                        {project.progress.percent}%
                      </p>
                    </div>
                    <SetFocusButton
                      workspaceId={workspaceId}
                      kind="project"
                      targetId={project.id}
                      targetTitle={project.title}
                      currentTitle={
                        focusProject ? focusProject.title : null
                      }
                    />
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 grid gap-2">
              <h3 className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
                Outros cursos
              </h3>
              {otherCourses.length === 0 ? (
                <p className="text-[12.5px] text-muted">
                  Nenhum outro curso disponível.
                </p>
              ) : (
                otherCourses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-1)] transition hover:border-brand/30 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">
                        {course.title}
                      </p>
                      <p className="text-[11px] text-faint">
                        {course.progress}% concluído
                      </p>
                    </div>
                    <SetFocusButton
                      workspaceId={workspaceId}
                      kind="course"
                      targetId={course.id}
                      targetTitle={course.title}
                      currentTitle={focusCourse ? focusCourse.title : null}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[11.5px] leading-relaxed text-faint">
              <ShieldCheck
                className="mt-0.5 size-3.5 flex-none"
                aria-hidden="true"
              />
              A troca é registrada com autor, data e foco anterior. Dois
              dispositivos não conseguem definir focos diferentes ao mesmo
              tempo.
            </div>
          </SectionCard>

          <SectionCard title="Fora do foco">
            {otherProjects.length === 0 && otherCourses.length === 0 ? (
              <p className="text-[12.5px] leading-relaxed text-muted">
                Tudo o que você tem já está no foco. Que tal registrar uma ideia
                para o futuro?
              </p>
            ) : (
              <div className="grid gap-2">
                {otherProjects.slice(0, 4).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projetos/${project.id}`}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface px-3 text-ink no-underline transition hover:border-brand/30 hover:bg-surface-2 hover:no-underline"
                  >
                    <FolderKanban
                      className="size-4 flex-none text-faint"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                      {project.title}
                    </span>
                    <span className="text-[11px] text-faint">
                      {project.progress.percent}%
                    </span>
                  </Link>
                ))}
                {otherCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    href="/cursos"
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface px-3 text-ink no-underline transition hover:border-brand/30 hover:bg-surface-2 hover:no-underline"
                  >
                    <BookOpen
                      className="size-4 flex-none text-faint"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                      {course.title}
                    </span>
                    <span className="text-[11px] text-faint">
                      {course.progress}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
