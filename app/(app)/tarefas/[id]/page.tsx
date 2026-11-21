import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CommentThread } from "@/components/comments/comment-thread";
import { FileMentionText } from "@/components/files/file-mention-text";
import { SectionCard } from "@/components/patterns/section-card";
import { DueDateChip, StatusChip } from "@/components/patterns/status-chip";
import { AssigneeSelect } from "@/components/tasks/assignee-select";
import { listComments } from "@/lib/data/comments";
import { getAppContext } from "@/lib/data/context";
import { getTaskDetail } from "@/lib/data/tasks";
import { listWorkspaceMembers } from "@/lib/data/workspace-members";
import { priorityLabel } from "@/modules/projects/domain";
import { KANBAN_COLUMNS } from "@/modules/tasks/kanban";
import { canComment, canEditContent, canManageMembers } from "@/modules/workspaces/domain";

export const metadata: Metadata = { title: "Tarefa" };

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getAppContext();
  if (!context.workspace) notFound();

  const task = await getTaskDetail({ workspaceId: context.workspace.id, taskId: id, today: context.today });
  if (!task) notFound();

  const [comments, members] = await Promise.all([
    listComments({ workspaceId: context.workspace.id, entityType: "task", entityId: task.id }),
    listWorkspaceMembers(context.workspace.id),
  ]);

  const role = context.workspace.role;
  const assignee = members.find((member) => member.userId === task.assigneeId);
  const options = members
    .filter((member) => member.status === "active" && member.role !== "reader")
    .map((member) => ({ id: member.userId, name: member.userId === context.user.id ? `${member.name} (você)` : member.name }));
  const statusLabel = KANBAN_COLUMNS.find((column) => column.status === task.status)?.label ?? task.status;

  return (
    <div className="grid gap-7">
      <Link href="/tarefas/quadro" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-[12px] font-semibold text-muted no-underline transition hover:border-brand/35 hover:text-ink hover:no-underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar ao quadro
      </Link>

<header className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-brand">{task.projectTitle ?? "Tarefa sem projeto"}</p>
          <h1 className="mt-3 max-w-3xl break-words text-3xl font-semibold tracking-[-.05em] sm:text-[40px]">{task.title}<span className="text-brand">.</span></h1>
          {task.description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted"><FileMentionText workspaceId={context.workspace.id} text={task.description} /></p> : <p className="mt-3 text-sm text-muted">Detalhes, responsáveis e conversa desta tarefa.</p>}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <SectionCard title="Conversa">
          <CommentThread
            workspaceId={context.workspace.id}
            entityType="task"
            entityId={task.id}
            comments={comments}
            viewerId={context.user.id}
            canComment={canComment(role)}
            canModerate={canManageMembers(role)}
          />
        </SectionCard>

        <aside className="grid content-start gap-5">
          <SectionCard title="Detalhes">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip label={statusLabel} tone={task.status === "done" ? "success" : "neutral"} />
              <StatusChip label={priorityLabel(task.priority)} tone={task.priority === "high" || task.priority === "urgent" ? "danger" : "neutral"} />
              {task.status !== "done" ? <DueDateChip state={task.dueState} /> : null}
            </div>
            <div className="mt-4">
              {canEditContent(role) ? (
                <AssigneeSelect taskId={task.id} current={task.assigneeId} options={options} />
              ) : (
                <p className="text-[13px]">
                  <span className="text-faint">Responsável: </span>
                  <span className="font-medium">{assignee ? assignee.name : "Sem responsável"}</span>
                </p>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
