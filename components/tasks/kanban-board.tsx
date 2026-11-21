"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  GripVertical,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { UserAvatar } from "@/components/layout/user-avatar";
import { StatusChip } from "@/components/patterns/status-chip";
import {
  moveTaskAction,
  reorderColumnAction,
  restoreItemAction,
  trashItemAction,
} from "@/lib/actions/mvp";
import type { KanbanTask } from "@/lib/data/tasks";
import { priorityLabel } from "@/modules/projects/domain";
import {
  adjacentStatus,
  KANBAN_COLUMNS,
  positionForIndex,
  rebalancePositions,
  type KanbanStatus,
} from "@/modules/tasks/kanban";
import { cn } from "@/lib/utils";

const byPosition = (a: KanbanTask, b: KanbanTask) => a.position - b.position;

const COLUMN_STYLES: Record<KanbanStatus, { marker: string; count: string; drop: string }> = {
  todo: {
    marker: "bg-slate-400",
    count: "bg-slate-500/10 text-slate-500 dark:text-slate-300",
    drop: "border-slate-400/50 bg-slate-400/5",
  },
  in_progress: {
    marker: "bg-brand",
    count: "bg-brand/10 text-brand",
    drop: "border-brand/60 bg-brand/5",
  },
  done: {
    marker: "bg-success",
    count: "bg-success/10 text-success",
    drop: "border-success/50 bg-success/5",
  },
};

function formatDueDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(year, month - 1, day, 12));
}

export function KanbanBoard({ tasks }: { tasks: KanbanTask[] }) {
  const [items, setItems] = useState(tasks);
  const [previousTasks, setPreviousTasks] = useState(tasks);
  const [announcement, setAnnouncement] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<KanbanStatus | null>(null);
  const [busy, setBusy] = useState(false);

  if (tasks !== previousTasks) {
    setPreviousTasks(tasks);
    setItems(tasks);
  }

  const column = (status: KanbanStatus, source = items) =>
    source.filter((task) => task.status === status).sort(byPosition);

  async function persist(
    task: KanbanTask,
    status: KanbanStatus,
    position: number,
    rebalanceIds: string[] | null,
  ): Promise<boolean> {
    const result = rebalanceIds
      ? await reorderColumnAction({ status, orderedIds: rebalanceIds })
      : await moveTaskAction({ taskId: task.id, status, position });
    if (result.status === "error") {
      toast.error(result.message ?? "Não foi possível mover a tarefa.");
      return false;
    }
    return true;
  }

  async function move(task: KanbanTask, status: KanbanStatus, index: number) {
    if (busy) return;
    const before = items;
    const others = column(status).filter((entry) => entry.id !== task.id);
    const safeIndex = Math.min(Math.max(index, 0), others.length);
    const { position, rebalance } = positionForIndex(
      others.map((entry) => entry.position),
      safeIndex,
    );
    const ordered = [
      ...others.slice(0, safeIndex),
      task,
      ...others.slice(safeIndex),
    ];
    const renumbered = rebalance ? rebalancePositions(ordered.length) : [];
    const next = before.map((entry) => {
      const at = ordered.findIndex((candidate) => candidate.id === entry.id);
      if (rebalance && at >= 0) {
        return { ...entry, status, position: renumbered[at] };
      }
      return entry.id === task.id ? { ...entry, status, position } : entry;
    });

    setItems(next);
    const label = KANBAN_COLUMNS.find((entry) => entry.status === status)?.label;
    setAnnouncement(
      `${task.title} movida para ${label}, posição ${safeIndex + 1} de ${ordered.length}.`,
    );

    setBusy(true);
    try {
      const saved = await persist(
        task,
        status,
        position,
        rebalance ? ordered.map((entry) => entry.id) : null,
      );
      if (!saved) {
        setItems(before);
        return;
      }

      if (status === "done" && task.status !== "done") {
        toast.success("Tarefa concluída.", {
          description: task.title,
          duration: 6000,
          action: {
            label: "Desfazer",
            onClick: () => {
              setItems(before);
              void persist(task, task.status, task.position, null);
            },
          },
        });
      }
    } finally {
      setBusy(false);
    }
  }

  function dropOnColumn(event: DragEvent<HTMLElement>, status: KanbanStatus) {
    event.preventDefault();
    event.stopPropagation();
    setDragOverStatus(null);
    const id = event.dataTransfer.getData("text/plain") || draggedTaskId;
    const dragged = items.find((entry) => entry.id === id);
    if (!dragged) return;
    if (dragged.id === id && dragged.status === status && column(status).length === 1) return;
    void move(dragged, status, column(status).filter((entry) => entry.id !== dragged.id).length);
    setDraggedTaskId(null);
  }

  function dropOnCard(
    event: DragEvent<HTMLElement>,
    status: KanbanStatus,
    targetId: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setDragOverStatus(null);
    const id = event.dataTransfer.getData("text/plain") || draggedTaskId;
    const dragged = items.find((entry) => entry.id === id);
    if (!dragged || dragged.id === targetId) {
      setDraggedTaskId(null);
      return;
    }
    const target = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > target.top + target.height / 2;
    const targetIndex = column(status).findIndex((entry) => entry.id === targetId);
    const insertAt = targetIndex + (after ? 1 : 0);
    const adjusted = dragged.status === status && column(status).findIndex((entry) => entry.id === dragged.id) < insertAt
      ? insertAt - 1
      : insertAt;
    void move(dragged, status, adjusted);
    setDraggedTaskId(null);
  }

  async function trash(task: KanbanTask) {
    if (busy) return;
    const before = items;
    setBusy(true);
    setItems(items.filter((entry) => entry.id !== task.id));
    try {
      const result = await trashItemAction("tasks", task.id);
      if (result.status === "error") {
        setItems(before);
        toast.error(result.message ?? "Não foi possível excluir.");
        return;
      }
      toast("Tarefa movida para a lixeira.", {
        description: task.title,
        duration: 8000,
        action: {
          label: "Desfazer",
          onClick: () => {
            setItems(before);
            void restoreItemAction("tasks", task.id);
          },
        },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0">
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <GripVertical className="size-3.5" aria-hidden="true" />
          No computador, arraste os cartões. No celular, use os controles do cartão.
        </span>
        <span className="hidden shrink-0 sm:inline">{items.length} no total</span>
      </div>

      <div
        className="-mx-4 grid grid-flow-col auto-cols-[minmax(280px,86vw)] gap-3 overflow-x-auto overscroll-x-contain px-4 pb-4 snap-x snap-mandatory sm:auto-cols-[minmax(300px,44vw)] lg:mx-0 lg:grid-flow-row lg:grid-cols-3 lg:auto-cols-auto lg:overflow-visible lg:px-0"
        aria-label="Colunas do quadro; deslize horizontalmente para ver as próximas"
      >
        {KANBAN_COLUMNS.map(({ status, label }) => {
          const cards = column(status);
          const style = COLUMN_STYLES[status];
          const isDropTarget = dragOverStatus === status;
          return (
            <section
              key={status}
              aria-labelledby={`col-${status}`}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverStatus(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragOverStatus(null);
                }
              }}
              onDrop={(event) => dropOnColumn(event, status)}
              className={cn(
                "flex min-h-[360px] min-w-0 snap-start flex-col rounded-2xl border border-border bg-surface-2/80 p-3 transition-colors sm:p-3.5",
                isDropTarget && style.drop,
              )}
            >
              <header className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={cn("size-2.5 shrink-0 rounded-full", style.marker)} />
                  <h2 id={`col-${status}`} className="truncate text-[13px] font-semibold text-ink">
                    {label}
                  </h2>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums", style.count)}>
                    {cards.length}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-faint">#{KANBAN_COLUMNS.findIndex((entry) => entry.status === status) + 1}</span>
              </header>

              <div className="grid flex-1 content-start gap-2.5">
                {cards.length === 0 ? (
                  <div className={cn(
                    "grid min-h-36 flex-1 place-items-center rounded-xl border border-dashed border-border-strong px-4 py-6 text-center transition-colors",
                    isDropTarget && style.drop,
                  )}>
                    <div>
                      <p className="text-[12px] font-medium text-muted">Solte uma tarefa aqui</p>
                      <p className="mt-1 text-[11px] text-faint">Esta coluna está vazia.</p>
                    </div>
                  </div>
                ) : (
                  cards.map((task, index) => {
                    const left = adjacentStatus(task.status, "left");
                    const right = adjacentStatus(task.status, "right");
                    const priorityTone = task.priority === "urgent" || task.priority === "high"
                      ? "danger"
                      : task.priority === "medium"
                        ? "warning"
                        : "neutral";
                    return (
                      <article
                        key={task.id}
                        draggable={!busy}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", task.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverStatus(null);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverStatus(status);
                        }}
                        onDrop={(event) => dropOnCard(event, status, task.id)}
                        className={cn(
                          "list-none rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-1)] transition-[opacity,border-color,box-shadow,transform] hover:border-brand/35 hover:shadow-[var(--shadow-2)] active:cursor-grabbing sm:p-4",
                          draggedTaskId === task.id && "opacity-40",
                          "cursor-grab",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/tarefas/${task.id}`}
                            className={cn(
                              "min-w-0 flex-1 text-[13.5px] leading-snug font-semibold text-ink no-underline hover:text-brand hover:underline sm:text-sm",
                              task.status === "done" && "line-through text-muted",
                            )}
                          >
                            {task.title}
                          </Link>
                          <span className="mt-0.5 shrink-0 text-[10px] text-faint" aria-hidden="true">
                            <GripVertical className="size-4" />
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <StatusChip label={priorityLabel(task.priority)} tone={priorityTone} />
                          {task.dueDate ? (
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                              task.dueState === "overdue"
                                ? "border-danger/25 bg-danger-soft text-[var(--danger-700)]"
                                : task.dueState === "today"
                                  ? "border-warning/35 bg-warning-soft text-[var(--warning-700)]"
                                  : "border-border bg-surface-2 text-muted",
                            )}>
                              <CalendarDays className="size-3" aria-hidden="true" />
                              {formatDueDate(task.dueDate)}
                              {task.dueState === "overdue" ? " · Atrasada" : task.dueState === "today" ? " · Hoje" : ""}
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-faint">Sem prazo</span>
                          )}
                        </div>

                        <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-border/80 pt-3">
                          <div className="flex min-w-0 items-center gap-2">
                            {task.assigneeName ? (
                              <>
                                <UserAvatar name={task.assigneeName} size="sm" />
                                <span className="truncate text-[11px] font-medium text-muted">{task.assigneeName}</span>
                              </>
                            ) : (
                              <span className="text-[11px] text-faint">Sem responsável</span>
                            )}
                          </div>
                          <span className="max-w-[42%] truncate text-right text-[10.5px] text-faint">
                            {task.projectTitle ?? "Sem projeto"}
                          </span>
                        </div>

                        <div
                          role="group"
                          aria-label={`Mover ou excluir ${task.title}`}
                          className="mt-3 flex items-center gap-1 border-t border-border/80 pt-2.5"
                        >
                          <CardButton label={`Mover ${task.title} para a coluna anterior`} disabled={busy || !left} onClick={() => left && move(task, left, column(left).length)}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton label={`Subir ${task.title} na coluna`} disabled={busy || index === 0} onClick={() => move(task, status, index - 1)}>
                            <ArrowUp className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton label={`Descer ${task.title} na coluna`} disabled={busy || index === cards.length - 1} onClick={() => move(task, status, index + 1)}>
                            <ArrowDown className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton label={`Mover ${task.title} para a próxima coluna`} disabled={busy || !right} onClick={() => right && move(task, right, 0)}>
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton label={`Excluir ${task.title}`} className="ml-auto" onClick={() => trash(task)} disabled={busy}>
                            <Trash2 className="size-4" aria-hidden="true" />
                          </CardButton>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CardButton({
  label,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-30 sm:size-8",
        className,
      )}
    >
      {children}
    </button>
  );
}
