import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  FolderKanban,
  Lightbulb,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import { CreateCourseForm } from "@/components/create/create-course-form";
import { CreateIdeaForm } from "@/components/create/create-idea-form";
import { CreateProjectForm } from "@/components/create/create-project-form";
import { CreateTaskForm } from "@/components/create/create-task-form";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { getAppContext } from "@/lib/data/context";
import { listCourses } from "@/lib/data/courses";
import { getFocusState } from "@/lib/data/focus";
import { listProjects } from "@/lib/data/projects";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Criar" };

type CreateType = "tarefa" | "ideia" | "projeto" | "curso";

const TYPES: {
  id: CreateType;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "tarefa",
    label: "Tarefa",
    description: "Algo para fazer, com ou sem prazo.",
    icon: ListChecks,
  },
  {
    id: "ideia",
    label: "Ideia",
    description: "Uma captura rápida para o backlog.",
    icon: Lightbulb,
  },
  {
    id: "projeto",
    label: "Projeto",
    description: "Um objetivo com tarefas e próximo passo.",
    icon: FolderKanban,
  },
  {
    id: "curso",
    label: "Curso",
    description: "Um estudo para acompanhar sem cobrança.",
    icon: BookOpen,
  },
];

function parseType(value: string | undefined): CreateType {
  return TYPES.some((type) => type.id === value)
    ? (value as CreateType)
    : "tarefa";
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; projeto?: string }>;
}) {
  const context = await getAppContext();
  const params = await searchParams;
  const type = parseType(params.tipo);

  if (!context.workspace) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Criar"
          description="Seu espaço ainda não está disponível."
        />
        <p className="text-sm text-muted">
          Rode as migrações do Supabase e recarregue a página para criar
          tarefas, ideias, projetos e cursos.
        </p>
      </div>
    );
  }

  const workspaceId = context.workspace.id;
  const [projects, courses, focus] = await Promise.all([
    listProjects({ workspaceId, today: context.today }),
    listCourses({ workspaceId, today: context.today }),
    getFocusState({
      workspaceId,
      userId: context.user.id,
      focusScope: context.workspace.focus_scope,
    }),
  ]);

  const selectedProject = projects.find(
    (project) => project.id === params.projeto,
  );
  const focusProject = projects.find(
    (project) => project.id === focus.projectId,
  );
  const focusCourse = courses.find((course) => course.id === focus.courseId);
  const activeType = TYPES.find((entry) => entry.id === type) ?? TYPES[0];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Captura rápida"
        title="Criar"
        description="Só o essencial é obrigatório. Você pode completar o resto depois, sem perder o que já escreveu."
      />

      <nav aria-label="Tipo de item" className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex w-max gap-2">
          {TYPES.map((entry) => {
            const Icon = entry.icon;
            const active = entry.id === type;
            return (
              <li key={entry.id}>
                <Link
                  href={`/criar?tipo=${entry.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold no-underline transition-colors",
                    active
                      ? "border-brand bg-brand text-white hover:bg-brand-hover hover:no-underline"
                      : "border-border-strong bg-surface text-ink hover:bg-surface-2 hover:no-underline",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)] lg:items-start">
        <SectionCard
          title={activeType.label}
          description={activeType.description}
        >
          {type === "tarefa" ? (
            <CreateTaskForm
              today={context.today}
              workspaceId={workspaceId}
              projects={projects
                .filter((project) => project.status !== "completed")
                .map((project) => ({ id: project.id, title: project.title }))}
              defaultProjectId={selectedProject?.id}
            />
          ) : null}

          {type === "ideia" ? <CreateIdeaForm workspaceId={workspaceId} /> : null}

          {type === "projeto" ? (
            <CreateProjectForm currentFocusTitle={focusProject?.title ?? null} />
          ) : null}

          {type === "curso" ? (
            <CreateCourseForm currentFocusTitle={focusCourse?.title ?? null} />
          ) : null}
        </SectionCard>

        <aside className="grid min-w-0 content-start gap-5">
          {selectedProject ? (
            <SectionCard title="Projeto escolhido">
              <p className="text-[13px] font-semibold">
                {selectedProject.title}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                A tarefa entra nesse projeto e aparece no detalhe dele.
              </p>
              <Link
                href={`/projetos/${selectedProject.id}`}
                className="mt-3 inline-flex min-h-9 items-center text-[12px] font-semibold text-brand no-underline hover:underline"
              >
                Abrir projeto
              </Link>
            </SectionCard>
          ) : null}

          <SectionCard title="O que acontece depois">
            <ul className="grid gap-2.5 text-[12.5px] leading-relaxed text-muted">
              {type === "tarefa" ? (
                <>
                  <li>Ela aparece na lista de tarefas, agrupada por prazo.</li>
                  <li>Concluir é um toque, com opção de desfazer.</li>
                  <li>Sem prazo não significa esquecida: fica em “Sem prazo”.</li>
                </>
              ) : null}
              {type === "ideia" ? (
                <>
                  <li>Ela vai para o backlog, fora do foco principal.</li>
                  <li>Você pode avaliar e promover a projeto depois.</li>
                  <li>Nada é apagado por ficar parado.</li>
                </>
              ) : null}
              {type === "projeto" ? (
                <>
                  <li>Você cai direto no projeto criado.</li>
                  <li>Se marcar como principal, o anterior volta para a lista.</li>
                  <li>A troca fica registrada no histórico do espaço.</li>
                </>
              ) : null}
              {type === "curso" ? (
                <>
                  <li>O curso aparece na lista de estudos.</li>
                  <li>Marcar como principal não apaga o curso anterior.</li>
                  <li>Você pode atualizar o progresso aos poucos.</li>
                </>
              ) : null}
            </ul>
          </SectionCard>

          <SectionCard title="Precisa de outro tipo?">
            <div className="grid gap-2">
              {TYPES.filter((entry) => entry.id !== type).map((entry) => {
                const Icon = entry.icon;
                return (
                  <Link
                    key={entry.id}
                    href={`/criar?tipo=${entry.id}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-medium text-ink no-underline hover:bg-surface-2 hover:no-underline"
                  >
                    <Icon className="size-4 text-brand" aria-hidden="true" />
                    Nova {entry.label.toLowerCase()}
                  </Link>
                );
              })}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
