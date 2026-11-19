import Link from "next/link";

import { TaskCheckbox } from "@/components/tasks/task-checkbox";
import { DueDateChip, StatusChip } from "@/components/patterns/status-chip";
import { UserAvatar } from "@/components/layout/user-avatar";
import { priorityLabel } from "@/modules/projects/domain";
import type { TaskListItem } from "@/lib/data/tasks";
import type { DueDateState } from "@/modules/tasks/domain";
import { cn } from "@/lib/utils";

/**
 * The row only needs what it renders. Both the full task list and the lighter
 * dashboard payload fit this shape.
 */
type TaskRowData = {
  id: string;
  title: string;
  priority: string;
  dueState: DueDateState;
  status?: "todo" | "in_progress" | "done";
  projectTitle?: string | null;
  assigneeName?: string | null;
};

export function TaskRow({
  task,
  className,
  showProject = true,
}: {
  task: TaskRowData;
  className?: string;
  showProject?: boolean;
}) {
  const done = task.status === "done";
  const highPriority =
    task.priority === "high" || task.priority === "urgent";

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-2 py-2.5 sm:px-3",
        done && "opacity-65",
        className,
      )}
    >
      <TaskCheckbox taskId={task.id} title={task.title} done={done} />

      <div className="min-w-0 flex-1 pt-2">
        <p
          className={cn(
            "text-[13.5px] leading-snug font-medium text-ink",
            done && "line-through decoration-1",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {showProject ? (
            <span className="text-[11.5px] text-faint">
              {task.projectTitle ?? "Sem projeto"}
            </span>
          ) : null}
          {!done ? <DueDateChip state={task.dueState} /> : null}
          <StatusChip
            label={priorityLabel(task.priority)}
            tone={highPriority ? "danger" : "neutral"}
          />
          {task.assigneeName ? (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-faint">
              <UserAvatar name={task.assigneeName} size="sm" />
              <span className="sr-only">Responsável: {task.assigneeName}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TaskRowLink({
  task,
  className,
}: {
  task: TaskListItem;
  className?: string;
}) {
  return (
    <Link
      href={`/tarefas/${task.id}`}
      className={cn(
        "block rounded-md no-underline transition-colors hover:bg-surface-2",
        className,
      )}
    >
      <TaskRow task={task} />
    </Link>
  );
}
