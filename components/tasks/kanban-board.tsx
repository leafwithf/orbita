"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { DueDateChip, StatusChip } from "@/components/patterns/status-chip";
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

export function KanbanBoard({ tasks }: { tasks: KanbanTask[] }) {
  const [items, setItems] = useState(tasks);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => setItems(tasks), [tasks]);

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
    const label = KANBAN_COLUMNS.find((c) => c.status === status)?.label;
    setAnnouncement(
      `${task.title} movida para ${label}, posição ${safeIndex + 1} de ${ordered.length}.`,
    );

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
  }

  async function trash(task: KanbanTask) {
    const before = items;
    setItems(items.filter((entry) => entry.id !== task.id));
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
  }

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {KANBAN_COLUMNS.map(({ status, label }) => {
          const cards = column(status);
          return (
            <section
              key={status}
              aria-labelledby={`col-${status}`}
              className="min-w-0 rounded-lg border border-border bg-surface-2 p-3"
            >
              <h2
                id={`col-${status}`}
                className="mb-3 flex items-center justify-between text-[13px] font-semibold"
              >
                {label}
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
                  {cards.length}
                </span>
              </h2>

              {cards.length === 0 ? (
                <p className="rounded-md border border-dashed border-border-strong p-4 text-center text-[12px] text-faint">
                  Nenhuma tarefa aqui.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {cards.map((task, index) => {
                    const left = adjacentStatus(task.status, "left");
                    const right = adjacentStatus(task.status, "right");
                    return (
                      <li
                        key={task.id}
                        className="rounded-md border border-border bg-surface p-3 shadow-[var(--shadow-1)]"
                      >
                        <Link
                          href={`/tarefas/${task.id}`}
                          className={cn(
                            "block text-[13.5px] leading-snug font-medium text-ink no-underline hover:underline",
                            task.status === "done" && "line-through",
                          )}
                        >
                          {task.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11.5px] text-faint">
                            {task.projectTitle ?? "Sem projeto"}
                          </span>
                          {task.status !== "done" ? (
                            <DueDateChip state={task.dueState} />
                          ) : null}
                          <StatusChip
                            label={priorityLabel(task.priority)}
                            tone={
                              task.priority === "high" || task.priority === "urgent"
                                ? "danger"
                                : "neutral"
                            }
                          />
                        </div>

                        <div
                          role="group"
                          aria-label={`Ações de ${task.title}`}
                          className="mt-2 flex flex-wrap gap-1"
                        >
                          <CardButton
                            label={`Mover ${task.title} para a coluna anterior`}
                            disabled={!left}
                            onClick={() => left && move(task, left, cards.length)}
                          >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton
                            label={`Subir ${task.title}`}
                            disabled={index === 0}
                            onClick={() => move(task, status, index - 1)}
                          >
                            <ArrowUp className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton
                            label={`Descer ${task.title}`}
                            disabled={index === cards.length - 1}
                            onClick={() => move(task, status, index + 1)}
                          >
                            <ArrowDown className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton
                            label={`Mover ${task.title} para a próxima coluna`}
                            disabled={!right}
                            onClick={() => right && move(task, right, 0)}
                          >
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </CardButton>
                          <CardButton
                            label={`Excluir ${task.title}`}
                            className="ml-auto"
                            onClick={() => trash(task)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </CardButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
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
        "grid size-11 place-items-center rounded-md border border-border bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
