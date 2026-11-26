"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { setTaskDoneAction } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";

export function TaskCheckbox({
  taskId,
  title,
  done = false,
  className,
}: {
  taskId: string;
  title: string;
  done?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(done);
  const [saving, setSaving] = useState(false);

  async function persist(next: boolean) {
    const result = await setTaskDoneAction(taskId, next);
    router.refresh();

    if (result.status === "error") {
      setChecked(!next);
      toast.error(result.message ?? "Não foi possível atualizar a tarefa.");
      return false;
    }

    return true;
  }

  async function toggle() {
    if (saving) return;

    const next = !checked;
    setChecked(next);
    setSaving(true);

    const ok = await persist(next);

    if (ok && next) {
      toast.success("Tarefa concluída.", {
        description: title,
        duration: 6000,
        action: {
          label: "Desfazer",
          onClick: () => {
            setChecked(false);
            void persist(false);
          },
        },
      });
    }

    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={checked}
      aria-label={checked ? `Reabrir: ${title}` : `Concluir: ${title}`}
      className={cn(
        "group grid size-11 flex-none place-items-center rounded-full text-muted transition-colors hover:text-success focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-5 place-items-center rounded-full border-[1.5px] border-border-strong bg-surface transition-colors group-hover:border-success",
          checked && "orbita-check-done border-[#E9CB8B] bg-[#E9CB8B] text-[#1A1210]",
        )}
      >
        {saving ? (
          <Loader2 className="size-3 animate-spin" />
        ) : checked ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : null}
      </span>
    </button>
  );
}
