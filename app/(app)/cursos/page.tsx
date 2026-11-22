import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, GraduationCap, Plus } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { ProgressLine } from "@/components/patterns/progress-line";
import { SectionCard } from "@/components/patterns/section-card";
import { DueDateChip, StatusChip } from "@/components/patterns/status-chip";
import { SetFocusButton } from "@/components/focus/set-focus-button";
import { getAppContext } from "@/lib/data/context";
import { listCourses } from "@/lib/data/courses";
import { getFocusState } from "@/lib/data/focus";
import { formatDatePtBr } from "@/lib/dates";
import { courseStatusLabel } from "@/modules/courses/domain";
import type { CourseListItem } from "@/lib/data/courses";

export const metadata: Metadata = { title: "Cursos" };

function CourseCard({
  course,
  isFocus,
  workspaceId,
  focusTitle,
}: {
  course: CourseListItem;
  isFocus: boolean;
  workspaceId: string;
  focusTitle: string | null;
}) {
  return (
    <article
      className={
        isFocus
          ? "relative overflow-hidden rounded-[24px] border border-brand/35 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_18%,transparent),transparent_58%),var(--surface)] p-5 shadow-[var(--shadow-2)] sm:p-6"
          : "rounded-[22px] border border-border bg-surface p-5 shadow-[var(--shadow-1)] transition hover:border-brand/30 sm:p-6"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {isFocus ? (
              <StatusChip label="Curso principal" tone="brand" icon={BookOpen} />
            ) : null}
            <StatusChip
              label={courseStatusLabel(course.status)}
              tone={course.status === "completed" ? "success" : "neutral"}
            />
          </div>
          <h3 className="mt-1.5 text-[15px] leading-snug font-semibold">
            {course.title}
          </h3>
          <p className="mt-0.5 text-[11.5px] text-faint">
            {[
              course.platform,
              course.moduleCount > 0
                ? `${course.doneModules} de ${course.moduleCount} módulos`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Sem plataforma definida"}
          </p>
        </div>
        {course.url ? (
          <a
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grid size-10 flex-none place-items-center rounded-md text-muted no-underline hover:bg-surface-2 hover:text-ink hover:no-underline"
            aria-label={`Abrir ${course.title} em nova aba`}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {course.objective ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          {course.objective}
        </p>
      ) : null}

      <div className="mt-3">
        <ProgressLine
          progress={{
            completedWeight: course.progress,
            totalWeight: 100,
            percent: course.progress,
            label:
              course.moduleCount > 0
                ? `${course.doneModules} de ${course.moduleCount} módulos`
                : "Progresso registrado",
          }}
        />
      </div>

      {course.nextLesson ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2.5">
          <ArrowRight
            className="mt-0.5 size-3.5 flex-none text-brand"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold tracking-[0.06em] text-faint uppercase">
              Próxima aula
            </p>
            <p className="mt-0.5 text-[12.5px] leading-snug font-medium">
              {course.nextLesson}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {course.dueDate ? (
          <div className="flex items-center gap-2">
            <DueDateChip state={course.dueState} />
            <span className="text-[11.5px] text-faint">
              {formatDatePtBr(course.dueDate)}
            </span>
          </div>
        ) : (
          <span className="text-[11.5px] text-faint">Sem prazo</span>
        )}

        {!isFocus && course.status !== "completed" ? (
          <SetFocusButton
            workspaceId={workspaceId}
            kind="course"
            targetId={course.id}
            targetTitle={course.title}
            currentTitle={focusTitle}
          />
        ) : null}
      </div>
    </article>
  );
}

export default async function CoursesPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Cursos"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const workspaceId = context.workspace.id;
  const [courses, focus] = await Promise.all([
    listCourses({ workspaceId, today: context.today }),
    getFocusState({
      workspaceId,
      userId: context.user.id,
      focusScope: context.workspace.focus_scope,
    }),
  ]);

  const focusCourse = courses.find((course) => course.id === focus.courseId);
  const otherCourses = courses.filter((course) => course.id !== focus.courseId);

  return (
    <div className="grid gap-6">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-brand/25 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_24%,transparent),transparent_55%),linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-8">
      <PageHeader
        eyebrow={`${courses.length} ${courses.length === 1 ? "curso" : "cursos"}`}
        title="Cursos e estudos"
        description="Um curso principal para manter o ritmo. Os outros ficam na fila, sem cobrança e sem sumir."
        actions={
          <Link
            href="/criar?tipo=curso"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo curso
          </Link>
        }
      />
      </section>

      {courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Nenhum curso ainda"
          description="Registre o que você está estudando, o próximo módulo e o prazo. O curso principal aparece na visão geral."
          action={
            <Link
              href="/criar?tipo=curso"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Adicionar curso
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6">
          <section aria-labelledby="curso-principal" className="grid gap-3">
            <h2
              id="curso-principal"
              className="text-[13px] font-semibold tracking-[0.04em] text-muted uppercase"
            >
              Em foco
            </h2>
            {focusCourse ? (
              <CourseCard
                course={focusCourse}
                isFocus
                workspaceId={workspaceId}
                focusTitle={null}
              />
            ) : (
              <SectionCard title="Escolha um curso principal">
                <p className="text-[13px] leading-relaxed text-muted">
                  Nenhum curso está em foco. Use “Definir como principal” em um
                  dos cursos abaixo para acompanhá-lo na visão geral.
                </p>
              </SectionCard>
            )}
          </section>

          {otherCourses.length > 0 ? (
            <section aria-labelledby="fila-cursos" className="grid gap-3">
              <h2
                id="fila-cursos"
                className="text-[13px] font-semibold tracking-[0.04em] text-muted uppercase"
              >
                Fila de estudos · {otherCourses.length}
              </h2>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {otherCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isFocus={false}
                    workspaceId={workspaceId}
                    focusTitle={focusCourse?.title ?? null}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
