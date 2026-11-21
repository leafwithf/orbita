import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  Plus,
  ShieldAlert,
} from "lucide-react";

import { CommentThread } from "@/components/comments/comment-thread";
import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { ProgressLine } from "@/components/patterns/progress-line";
import { SectionCard } from "@/components/patterns/section-card";
import { DueDateChip, StatusChip } from "@/components/patterns/status-chip";
import { TaskRow } from "@/components/tasks/task-row";
import { ProjectEmojiEditor } from "@/components/projects/project-emoji-editor";
import { ProjectDetailsEditor } from "@/components/projects/project-details-editor";
import { ProjectSwitcher } from "@/components/projects/project-switcher";
import { listComments } from "@/lib/data/comments";
import { listProjectFiles } from "@/lib/data/files";
import { FileActions } from "@/components/files/file-actions";
import { FileUploader } from "@/components/files/file-uploader";
import { formatBytes } from "@/modules/files/domain";
import { getAppContext } from "@/lib/data/context";
import { getProjectDetail, listProjects } from "@/lib/data/projects";
import { listTasks } from "@/lib/data/tasks";
import { formatDatePtBr } from "@/lib/dates";
import { canComment, canEditContent, canManageMembers } from "@/modules/workspaces/domain";
import {
  PROJECT_STATUS_LABELS,
  projectStageLabel,
} from "@/modules/projects/domain";

type PageParams = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { id } = await params;
  const context = await getAppContext().catch(() => null);

  if (!context?.workspace) return { title: "Projeto" };

  const project = await getProjectDetail({
    workspaceId: context.workspace.id,
    projectId: id,
    today: context.today,
  });

  return { title: project?.title ?? "Projeto" };
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { id } = await params;
  const { aviso } = await searchParams;
  const context = await getAppContext();

  if (!context.workspace) notFound();

  const project = await getProjectDetail({
    workspaceId: context.workspace.id,
    projectId: id,
    today: context.today,
  });

  if (!project) notFound();

  const [tasks, workspaceProjects] = await Promise.all([listTasks({
    workspaceId: context.workspace.id,
    today: context.today,
    includeDone: true,
    projectId: project.id,
  }), listProjects({ workspaceId: context.workspace.id, today: context.today })]);
  const canEditProject = project.ownerId === context.user.id && canEditContent(context.workspace.role);
  const openTasks = tasks.filter((task) => task.status !== "done");
  const [comments, projectFiles] = await Promise.all([listComments({
    workspaceId: context.workspace.id,
    entityType: "project",
    entityId: project.id,
  }), listProjectFiles({ workspaceId: context.workspace.id, projectId: project.id })]);

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/projetos"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted no-underline hover:text-ink hover:no-underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Voltar para projetos
        </Link>
      </div>

      {aviso === "foco" ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-md border border-warning/35 bg-warning-soft px-3.5 py-3 text-[12.5px] leading-relaxed text-ink"
        >
          <ShieldAlert
            className="mt-0.5 size-4 flex-none text-[var(--warning-700)]"
            aria-hidden="true"
          />
          Projeto criado. Não foi possível defini-lo como principal agora — use
          “Definir como principal” na tela Meu foco.
        </div>
      ) : null}

      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5">{project.coverUrl ? <img src={project.coverUrl} alt="" className="size-5 rounded-md object-cover" /> : project.emoji} Projeto</span>}
        title={project.title}
        description={
          project.objective ?? "Sem objetivo escrito ainda. Um objetivo ajuda a decidir o que fica de fora."
        }
        actions={
          <>
            <ProjectSwitcher currentProjectId={project.id} projects={workspaceProjects} />
            {canEditProject ? <ProjectDetailsEditor project={project} /> : null}
            <Link
              href={`/criar?tipo=tarefa&projeto=${project.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova tarefa
            </Link>
          </>
        }
      />

      {canEditProject ? (
        <SectionCard title="Identidade do projeto" description="Use um emoji ou envie uma imagem para identificar o projeto nos cartões, listas e nesta página.">
          <ProjectEmojiEditor projectId={project.id} currentEmoji={project.emoji} currentImage={project.coverUrl} />
        </SectionCard>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusChip label={projectStageLabel(project.stage)} tone="brand" />
        <StatusChip
          label={PROJECT_STATUS_LABELS[project.status]}
          tone={project.status === "completed" ? "success" : "neutral"}
        />
        {project.dueDate ? (
          <DueDateChip state={project.dueState} />
        ) : (
          <StatusChip label="Sem prazo" tone="neutral" />
        )}
        {project.startDate ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-faint">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Início em {formatDatePtBr(project.startDate)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <SectionCard title="Progresso">
            <ProgressLine progress={project.progress} />
            <p className="mt-3 text-[12px] leading-relaxed text-faint">
              O progresso considera apenas as tarefas de primeiro nível ativas,
              com peso igual por padrão. Tarefas arquivadas não entram na conta.
            </p>
          </SectionCard>

          <SectionCard
            title="Próximo passo"
            description="Uma frase clara sobre o que fazer em seguida."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="grid size-9 flex-none place-items-center rounded-full bg-brand-soft text-brand">
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
              <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed font-medium">
                {project.nextStep ??
                  "Ainda não definido. Escreva o próximo passo em uma frase curta e acionável."}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title={`Tarefas · ${openTasks.length} em aberto`}
            description="Concluir é um toque. Você pode desfazer em seguida."
            action={
              <Link
                href={`/criar?tipo=tarefa&projeto=${project.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[12px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Adicionar
              </Link>
            }
            bodyClassName="p-0 sm:p-0"
          >
            {tasks.length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyState
                  icon={ListChecks}
                  title="Nenhuma tarefa ainda"
                  description="Divida o projeto em passos pequenos o suficiente para concluir em uma sentada."
                  compact
                  action={
                    <Link
                      href={`/criar?tipo=tarefa&projeto=${project.id}`}
                      className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
                    >
                      Criar primeira tarefa
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} showProject={false} />
                ))}
              </div>
            )}
          </SectionCard>

          {tasks.some((task) => task.status === "done") ? (
            <p className="flex items-center gap-2 px-1 text-[12px] text-faint">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Tarefas concluídas continuam aparecendo aqui, com risco no título.
            </p>
          ) : null}

          <SectionCard title={`Arquivos do projeto · ${projectFiles.length}`} description="Materiais e referências compartilhados com quem tem acesso a este projeto.">
            <div className="grid gap-4">
              <FileUploader workspaceId={context.workspace.id} projectId={project.id} />
              {projectFiles.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-[12.5px] text-muted">Nenhum arquivo neste projeto ainda. Envie o primeiro material acima.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {projectFiles.map((file) => (
                    <li key={file.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="grid size-9 flex-none place-items-center rounded-md bg-surface-2 text-brand"><span className="text-[11px] font-bold">{file.fileName.split(".").pop()?.slice(0, 4).toUpperCase()}</span></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{file.fileName}</p>
                        <p className="mt-0.5 text-[11px] text-faint">{formatBytes(file.sizeBytes)} · {file.authorName} · {formatDatePtBr(file.createdAt.slice(0, 10))}</p>
                      </div>
                      <FileActions fileId={file.id} fileName={file.fileName} mime={file.mime} ready={file.status === "ready"} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Conversa">
            <CommentThread
              workspaceId={context.workspace.id}
              entityType="project"
              entityId={project.id}
              comments={comments}
              files={projectFiles.filter((file) => file.status === "ready").map(({ id, fileName }) => ({ id, fileName }))}
              viewerId={context.user.id}
              canComment={canComment(context.workspace.role)}
              canModerate={canManageMembers(context.workspace.role)}
            />
          </SectionCard>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard title="Sobre o projeto">
            <dl className="grid gap-3 text-[13px]">
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
                  Objetivo
                </dt>
                <dd className="mt-0.5 leading-relaxed text-muted">
                  {project.objective ?? "Não escrito."}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
                  Descrição
                </dt>
                <dd className="mt-0.5 leading-relaxed text-muted">
                  {project.description ?? "Não escrita."}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
                  Criado em
                </dt>
                <dd className="mt-0.5 text-muted">
                  {formatDatePtBr(project.createdAt.slice(0, 10))}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Riscos e bloqueios">
            {project.risks ? (
              <p className="text-[13px] leading-relaxed text-muted">
                {project.risks}
              </p>
            ) : (
              <div className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-muted">
                <ShieldAlert
                  className="mt-0.5 size-4 flex-none text-[var(--warning-700)]"
                  aria-hidden="true"
                />
                Nenhum risco registrado. Se algo pode travar a entrega, escreva
                aqui antes que vire surpresa.
              </div>
            )}
          </SectionCard>

          <p className="px-1 text-[11.5px] leading-relaxed text-faint">
            Excluir um projeto leva para a lixeira por 30 dias. Nada é apagado
            de imediato.
          </p>
        </aside>
      </div>
    </div>
  );
}
