"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { assignTaskAction } from "@/lib/actions/collab";

export type AssigneeOption = { id: string; name: string };

export function AssigneeSelect({
  taskId,
  current,
  options,
}: {
  taskId: string;
  current: string | null;
  options: AssigneeOption[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    const result = await assignTaskAction({ taskId, assigneeId: next || null });
    setSaving(false);
    if (result.status === "error") {
      setValue(previous);
      toast.error(result.message ?? "Não foi possível atribuir.");
      return;
    }
    toast.success(next ? "Responsável atualizado." : "Tarefa sem responsável.");
    router.refresh();
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor="assignee" className="text-[13px] font-medium">
        Responsável
      </label>
      <select
        id="assignee"
        value={value}
        disabled={saving}
        onChange={(event) => change(event.target.value)}
        className="h-11 rounded-md border border-border-strong bg-surface px-3 text-[15px] md:text-sm"
      >
        <option value="">Sem responsável</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-faint">Leitores não aparecem: eles não podem receber tarefas.</p>
    </div>
  );
}
